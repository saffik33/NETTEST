from datetime import datetime, timedelta, timezone

import sqlalchemy as sa
from fastapi import APIRouter, Depends
from sqlalchemy import extract, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import _is_sqlite, get_db
from app.models.ping_test import PingResult
from app.models.speed_test import SpeedTestResult
from app.services.health_score_service import compute_health_score, get_score_timeline
from app.schemas.dashboard import DashboardSummaryResponse, HealthScoreResponse
from app.services.uptime_service import get_probe_history, get_uptime_stats

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummaryResponse)
async def dashboard_summary(period: str = "24h", db: AsyncSession = Depends(get_db)):
    period_map = {"24h": 1, "7d": 7, "30d": 30}
    days = period_map.get(period, 1)
    since = datetime.now(timezone.utc) - timedelta(days=days)

    # Speed stats
    speed_result = await db.execute(
        select(
            func.avg(SpeedTestResult.download_mbps),
            func.avg(SpeedTestResult.upload_mbps),
            func.max(SpeedTestResult.download_mbps),
            func.count(),
        ).where(SpeedTestResult.timestamp >= since)
    )
    speed_row = speed_result.one()

    # Ping stats
    ping_result = await db.execute(
        select(
            func.avg(PingResult.avg_latency_ms),
            func.avg(PingResult.jitter_ms),
            func.avg(PingResult.packet_loss_pct),
        ).where(PingResult.timestamp >= since)
    )
    ping_row = ping_result.one()

    return {
        "period": period,
        "speed": {
            "avg_download": round(speed_row[0] or 0, 2),
            "avg_upload": round(speed_row[1] or 0, 2),
            "max_download": round(speed_row[2] or 0, 2),
            "test_count": speed_row[3],
        },
        "ping": {
            "avg_latency": round(ping_row[0] or 0, 2),
            "avg_jitter": round(ping_row[1] or 0, 2),
            "avg_packet_loss": round(ping_row[2] or 0, 2),
        },
    }


@router.get("/heatmap")
async def dashboard_heatmap(
    metric: str = "download_mbps",
    period: str = "7d",
    db: AsyncSession = Depends(get_db),
):
    period_map = {"7d": 7, "30d": 30}
    days = period_map.get(period, 7)
    since = datetime.now(timezone.utc) - timedelta(days=days)

    if metric in ("download_mbps", "upload_mbps"):
        model = SpeedTestResult
        col = getattr(SpeedTestResult, metric)
        ts_col = SpeedTestResult.timestamp
    elif metric == "avg_latency_ms":
        model = PingResult
        col = PingResult.avg_latency_ms
        ts_col = PingResult.timestamp
    else:
        return {"data": []}

    if _is_sqlite:
        day_col = func.strftime("%w", ts_col).label("day_of_week")
        hour_col = func.strftime("%H", ts_col).label("hour_of_day")
    else:
        day_col = extract("dow", ts_col).cast(sa.String).label("day_of_week")
        hour_col = extract("hour", ts_col).cast(sa.String).label("hour_of_day")

    result = await db.execute(
        select(
            day_col,
            hour_col,
            func.avg(col).label("avg_value"),
            func.count().label("sample_count"),
        )
        .where(ts_col >= since)
        .group_by("day_of_week", "hour_of_day")
    )
    rows = result.all()

    return {
        "metric": metric,
        "period": period,
        "data": [
            {
                "day_of_week": int(r.day_of_week),
                "hour_of_day": int(r.hour_of_day),
                "avg_value": round(r.avg_value, 2),
                "sample_count": r.sample_count,
            }
            for r in rows
        ],
    }


@router.get("/health-score", response_model=HealthScoreResponse)
async def dashboard_health_score(period: str = "24h", db: AsyncSession = Depends(get_db)):
    score = await compute_health_score(db, period)
    if score is None:
        return {"score": None, "message": "No test data available for this period", "period": period}
    return {
        "overall": score.overall,
        "breakdown": {
            "download": score.download_score,
            "upload": score.upload_score,
            "latency": score.latency_score,
            "jitter": score.jitter_score,
            "packet_loss": score.packet_loss_score,
            "wifi_signal": score.wifi_signal_score,
        },
        "trend_pct": score.trend_pct,
        "period": period,
    }


@router.get("/health-timeline")
async def dashboard_health_timeline(days: int = 7, db: AsyncSession = Depends(get_db)):
    timeline = await get_score_timeline(db, days=days)
    return {"days": days, "timeline": timeline}


@router.get("/uptime")
async def dashboard_uptime(period: str = "24h", db: AsyncSession = Depends(get_db)):
    return await get_uptime_stats(db, period)


@router.get("/uptime/probes")
async def dashboard_uptime_probes(limit: int = 120, db: AsyncSession = Depends(get_db)):
    return await get_probe_history(db, limit)
