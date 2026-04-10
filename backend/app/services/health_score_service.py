"""Network Health Score: 0-100 composite score from speed, latency, jitter, packet loss, and WiFi signal."""

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ping_test import PingResult
from app.models.speed_test import SpeedTestResult
from app.models.wifi_info import WiFiSnapshot


@dataclass
class ScoreBreakdown:
    overall: int
    download_score: int
    upload_score: int
    latency_score: int
    jitter_score: int
    packet_loss_score: int
    wifi_signal_score: int | None
    trend_pct: float | None  # % change vs previous period (positive = improvement)


# --- Scoring functions (each returns 0-100) ---

def _score_download(mbps: float) -> int:
    """100 Mbps+ = 100, 0 Mbps = 0, logarithmic curve."""
    if mbps <= 0:
        return 0
    if mbps >= 100:
        return 100
    return min(100, int((mbps / 100) * 100))


def _score_upload(mbps: float) -> int:
    """50 Mbps+ = 100, scaled linearly."""
    if mbps <= 0:
        return 0
    if mbps >= 50:
        return 100
    return min(100, int((mbps / 50) * 100))


def _score_latency(ms: float) -> int:
    """<5ms = 100, >200ms = 0, inverse scale."""
    if ms <= 5:
        return 100
    if ms >= 200:
        return 0
    return max(0, int(100 - ((ms - 5) / 195) * 100))


def _score_jitter(ms: float) -> int:
    """<1ms = 100, >50ms = 0."""
    if ms <= 1:
        return 100
    if ms >= 50:
        return 0
    return max(0, int(100 - ((ms - 1) / 49) * 100))


def _score_packet_loss(pct: float) -> int:
    """0% = 100, >=5% = 0."""
    if pct <= 0:
        return 100
    if pct >= 5:
        return 0
    return max(0, int(100 - (pct / 5) * 100))


def _score_wifi_signal(pct: int) -> int:
    """Direct mapping: signal_pct is already 0-100."""
    return max(0, min(100, pct))


# Weights for the composite score
WEIGHTS = {
    "download": 0.25,
    "upload": 0.15,
    "latency": 0.25,
    "jitter": 0.10,
    "packet_loss": 0.15,
    "wifi_signal": 0.10,
}


async def compute_health_score(db: AsyncSession, period: str = "24h") -> ScoreBreakdown | None:
    """Compute composite health score from recent test data."""
    period_map = {"1h": 1 / 24, "24h": 1, "7d": 7, "30d": 30}
    days = period_map.get(period, 1)
    since = datetime.now(timezone.utc) - timedelta(days=days)

    # Speed averages
    speed_row = (await db.execute(
        select(
            func.avg(SpeedTestResult.download_mbps),
            func.avg(SpeedTestResult.upload_mbps),
            func.count(),
        ).where(SpeedTestResult.timestamp >= since)
    )).one()

    # Ping averages
    ping_row = (await db.execute(
        select(
            func.avg(PingResult.avg_latency_ms),
            func.avg(PingResult.jitter_ms),
            func.avg(PingResult.packet_loss_pct),
            func.count(),
        ).where(PingResult.timestamp >= since)
    )).one()

    # WiFi average
    wifi_row = (await db.execute(
        select(
            func.avg(WiFiSnapshot.signal_pct),
            func.count(),
        ).where(WiFiSnapshot.timestamp >= since)
    )).one()

    total_tests = (speed_row[2] or 0) + (ping_row[3] or 0)
    if total_tests == 0:
        return None

    download_score = _score_download(speed_row[0] or 0)
    upload_score = _score_upload(speed_row[1] or 0)
    latency_score = _score_latency(ping_row[0] or 0)
    jitter_score = _score_jitter(ping_row[1] or 0)
    packet_loss_score = _score_packet_loss(ping_row[2] or 0)

    wifi_signal_score = None
    has_wifi = (wifi_row[1] or 0) > 0 and wifi_row[0] is not None
    if has_wifi:
        wifi_signal_score = _score_wifi_signal(int(wifi_row[0]))

    # Weighted composite
    if has_wifi:
        overall = (
            download_score * WEIGHTS["download"]
            + upload_score * WEIGHTS["upload"]
            + latency_score * WEIGHTS["latency"]
            + jitter_score * WEIGHTS["jitter"]
            + packet_loss_score * WEIGHTS["packet_loss"]
            + wifi_signal_score * WEIGHTS["wifi_signal"]
        )
    else:
        # Redistribute WiFi weight proportionally
        non_wifi_total = sum(v for k, v in WEIGHTS.items() if k != "wifi_signal")
        overall = (
            download_score * (WEIGHTS["download"] / non_wifi_total)
            + upload_score * (WEIGHTS["upload"] / non_wifi_total)
            + latency_score * (WEIGHTS["latency"] / non_wifi_total)
            + jitter_score * (WEIGHTS["jitter"] / non_wifi_total)
            + packet_loss_score * (WEIGHTS["packet_loss"] / non_wifi_total)
        )

    # Trend: compare current period vs previous period of same length
    prev_since = since - timedelta(days=days)
    prev_speed = (await db.execute(
        select(func.avg(SpeedTestResult.download_mbps))
        .where(SpeedTestResult.timestamp >= prev_since, SpeedTestResult.timestamp < since)
    )).scalar()

    trend_pct = None
    if prev_speed and prev_speed > 0 and speed_row[0]:
        trend_pct = round(((speed_row[0] - prev_speed) / prev_speed) * 100, 1)

    return ScoreBreakdown(
        overall=round(overall),
        download_score=download_score,
        upload_score=upload_score,
        latency_score=latency_score,
        jitter_score=jitter_score,
        packet_loss_score=packet_loss_score,
        wifi_signal_score=wifi_signal_score,
        trend_pct=trend_pct,
    )


async def get_score_timeline(db: AsyncSession, days: int = 7) -> list[dict]:
    """Get daily health scores for the timeline view."""
    timeline = []
    now = datetime.now(timezone.utc)

    for i in range(days, 0, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)

        speed_row = (await db.execute(
            select(
                func.avg(SpeedTestResult.download_mbps),
                func.avg(SpeedTestResult.upload_mbps),
            ).where(SpeedTestResult.timestamp >= day_start, SpeedTestResult.timestamp < day_end)
        )).one()

        ping_row = (await db.execute(
            select(
                func.avg(PingResult.avg_latency_ms),
                func.avg(PingResult.jitter_ms),
                func.avg(PingResult.packet_loss_pct),
            ).where(PingResult.timestamp >= day_start, PingResult.timestamp < day_end)
        )).one()

        wifi_row = (await db.execute(
            select(func.avg(WiFiSnapshot.signal_pct))
            .where(WiFiSnapshot.timestamp >= day_start, WiFiSnapshot.timestamp < day_end)
        )).scalar()

        if not speed_row[0] and not ping_row[0]:
            timeline.append({"date": day_start.strftime("%Y-%m-%d"), "score": None})
            continue

        dl = _score_download(speed_row[0] or 0)
        ul = _score_upload(speed_row[1] or 0)
        lat = _score_latency(ping_row[0] or 0)
        jit = _score_jitter(ping_row[1] or 0)
        pl = _score_packet_loss(ping_row[2] or 0)

        if wifi_row is not None:
            ws = _score_wifi_signal(int(wifi_row))
            score = (dl * 0.25 + ul * 0.15 + lat * 0.25 + jit * 0.10 + pl * 0.15 + ws * 0.10)
        else:
            t = 0.90
            score = (dl * 0.25 / t + ul * 0.15 / t + lat * 0.25 / t + jit * 0.10 / t + pl * 0.15 / t)

        timeline.append({"date": day_start.strftime("%Y-%m-%d"), "score": round(score)})

    return timeline
