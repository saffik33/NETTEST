import logging
from datetime import datetime, timezone, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.alert_config import AlertThreshold
from app.models.alert_event import AlertEvent
from app.models.speed_test import SpeedTestResult
from app.models.ping_test import PingResult
from app.models.wifi_info import WiFiSnapshot

logger = logging.getLogger(__name__)

# Maps metric_name -> (model_class, attribute_name)
METRIC_MAP: dict[str, tuple[type, str]] = {
    "download_mbps": (SpeedTestResult, "download_mbps"),
    "upload_mbps": (SpeedTestResult, "upload_mbps"),
    "avg_latency_ms": (PingResult, "avg_latency_ms"),
    "jitter_ms": (PingResult, "jitter_ms"),
    "packet_loss_pct": (PingResult, "packet_loss_pct"),
    "signal_pct": (WiFiSnapshot, "signal_pct"),
}


def _check_condition(value: float, condition: str, threshold: float) -> bool:
    if condition == "lt":
        return value < threshold
    elif condition == "gt":
        return value > threshold
    elif condition == "eq":
        return value == threshold
    return False


def _build_message(metric_name: str, value: float, condition: str, threshold: float) -> str:
    labels = {
        "download_mbps": "Download speed",
        "upload_mbps": "Upload speed",
        "avg_latency_ms": "Latency",
        "jitter_ms": "Jitter",
        "packet_loss_pct": "Packet loss",
        "signal_pct": "WiFi signal",
    }
    units = {
        "download_mbps": "Mbps",
        "upload_mbps": "Mbps",
        "avg_latency_ms": "ms",
        "jitter_ms": "ms",
        "packet_loss_pct": "%",
        "signal_pct": "%",
    }
    label = labels.get(metric_name, metric_name)
    unit = units.get(metric_name, "")
    op = "<" if condition == "lt" else (">" if condition == "gt" else "=")
    return f"{label} is {value:.1f}{unit} (threshold: {op} {threshold}{unit})"


async def evaluate_alerts(session_id: int, db: AsyncSession) -> list[AlertEvent]:
    """Evaluate all enabled thresholds against the latest test session results.
    Returns list of newly created AlertEvent objects."""

    thresholds_result = await db.execute(
        select(AlertThreshold).where(AlertThreshold.enabled == True)
    )
    thresholds = thresholds_result.scalars().all()

    if not thresholds:
        return []

    # Collect metric values from this session
    metric_values: dict[str, float] = {}

    speed_result = await db.execute(
        select(SpeedTestResult).where(SpeedTestResult.test_session_id == session_id)
    )
    speed = speed_result.scalar_one_or_none()
    if speed:
        metric_values["download_mbps"] = speed.download_mbps
        metric_values["upload_mbps"] = speed.upload_mbps

    ping_result = await db.execute(
        select(PingResult).where(PingResult.test_session_id == session_id)
    )
    ping = ping_result.scalar_one_or_none()
    if ping:
        metric_values["avg_latency_ms"] = ping.avg_latency_ms
        metric_values["jitter_ms"] = ping.jitter_ms
        metric_values["packet_loss_pct"] = ping.packet_loss_pct

    wifi_result = await db.execute(
        select(WiFiSnapshot).where(WiFiSnapshot.test_session_id == session_id)
    )
    wifi = wifi_result.scalar_one_or_none()
    if wifi and wifi.signal_pct is not None:
        metric_values["signal_pct"] = float(wifi.signal_pct)

    triggered_events: list[AlertEvent] = []
    now = datetime.now(timezone.utc)

    for threshold in thresholds:
        if threshold.metric_name not in metric_values:
            continue

        value = metric_values[threshold.metric_name]

        if not _check_condition(value, threshold.condition, threshold.threshold_value):
            continue

        # Check cooldown: find last event for this threshold
        last_event_result = await db.execute(
            select(AlertEvent)
            .where(AlertEvent.threshold_id == threshold.id)
            .order_by(AlertEvent.triggered_at.desc())
            .limit(1)
        )
        last_event = last_event_result.scalar_one_or_none()

        if last_event:
            cooldown_end = last_event.triggered_at.replace(tzinfo=timezone.utc) + timedelta(minutes=threshold.cooldown_minutes)
            if now < cooldown_end:
                logger.debug(
                    "Skipping alert for %s (cooldown until %s)",
                    threshold.metric_name, cooldown_end.isoformat()
                )
                continue

        event = AlertEvent(
            threshold_id=threshold.id,
            test_session_id=session_id,
            metric_name=threshold.metric_name,
            metric_value=value,
            threshold_value=threshold.threshold_value,
            condition=threshold.condition,
            message=_build_message(threshold.metric_name, value, threshold.condition, threshold.threshold_value),
            triggered_at=now,
        )
        db.add(event)
        triggered_events.append(event)

    if triggered_events:
        await db.commit()
        # Refresh to get IDs
        for ev in triggered_events:
            await db.refresh(ev)
        logger.info("Triggered %d alert(s) for session %d", len(triggered_events), session_id)

    return triggered_events
