from datetime import datetime, timezone, timedelta

import pytest
import pytest_asyncio

from app.models.alert_config import AlertThreshold
from app.models.alert_event import AlertEvent
from app.models.ping_test import PingResult
from app.models.speed_test import SpeedTestResult
from app.models.test_session import TestSession
from app.models.wifi_info import WiFiSnapshot
from app.services.alert_service import evaluate_alerts


async def _create_session(db, status="completed"):
    session = TestSession(
        started_at=datetime.now(timezone.utc),
        completed_at=datetime.now(timezone.utc),
        trigger_type="manual",
        status=status,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@pytest.mark.asyncio
async def test_alert_triggers_on_low_download(db):
    session = await _create_session(db)
    db.add(SpeedTestResult(
        test_session_id=session.id,
        download_mbps=10.0,
        upload_mbps=5.0,
        timestamp=datetime.now(timezone.utc),
    ))
    db.add(AlertThreshold(
        metric_name="download_mbps",
        condition="lt",
        threshold_value=25.0,
        enabled=True,
        cooldown_minutes=30,
    ))
    await db.commit()

    events = await evaluate_alerts(session.id, db)
    assert len(events) == 1
    assert events[0].metric_name == "download_mbps"
    assert events[0].metric_value == 10.0
    assert "Download speed" in events[0].message


@pytest.mark.asyncio
async def test_alert_does_not_trigger_when_above_threshold(db):
    session = await _create_session(db)
    db.add(SpeedTestResult(
        test_session_id=session.id,
        download_mbps=100.0,
        upload_mbps=50.0,
        timestamp=datetime.now(timezone.utc),
    ))
    db.add(AlertThreshold(
        metric_name="download_mbps",
        condition="lt",
        threshold_value=25.0,
        enabled=True,
        cooldown_minutes=30,
    ))
    await db.commit()

    events = await evaluate_alerts(session.id, db)
    assert len(events) == 0


@pytest.mark.asyncio
async def test_alert_respects_cooldown(db):
    session1 = await _create_session(db)
    db.add(SpeedTestResult(
        test_session_id=session1.id,
        download_mbps=10.0,
        upload_mbps=5.0,
        timestamp=datetime.now(timezone.utc),
    ))
    threshold = AlertThreshold(
        metric_name="download_mbps",
        condition="lt",
        threshold_value=25.0,
        enabled=True,
        cooldown_minutes=30,
    )
    db.add(threshold)
    await db.commit()

    # First evaluation should trigger
    events1 = await evaluate_alerts(session1.id, db)
    assert len(events1) == 1

    # Second evaluation with same data should be in cooldown
    session2 = await _create_session(db)
    db.add(SpeedTestResult(
        test_session_id=session2.id,
        download_mbps=10.0,
        upload_mbps=5.0,
        timestamp=datetime.now(timezone.utc),
    ))
    await db.commit()

    events2 = await evaluate_alerts(session2.id, db)
    assert len(events2) == 0


@pytest.mark.asyncio
async def test_alert_disabled_threshold_skipped(db):
    session = await _create_session(db)
    db.add(SpeedTestResult(
        test_session_id=session.id,
        download_mbps=10.0,
        upload_mbps=5.0,
        timestamp=datetime.now(timezone.utc),
    ))
    db.add(AlertThreshold(
        metric_name="download_mbps",
        condition="lt",
        threshold_value=25.0,
        enabled=False,
        cooldown_minutes=30,
    ))
    await db.commit()

    events = await evaluate_alerts(session.id, db)
    assert len(events) == 0


@pytest.mark.asyncio
async def test_alert_gt_condition_for_latency(db):
    session = await _create_session(db)
    db.add(PingResult(
        test_session_id=session.id,
        target_host="8.8.8.8",
        avg_latency_ms=150.0,
        min_latency_ms=120.0,
        max_latency_ms=200.0,
        jitter_ms=20.0,
        packet_loss_pct=0.0,
        packets_sent=20,
        packets_received=20,
        timestamp=datetime.now(timezone.utc),
    ))
    db.add(AlertThreshold(
        metric_name="avg_latency_ms",
        condition="gt",
        threshold_value=100.0,
        enabled=True,
        cooldown_minutes=30,
    ))
    await db.commit()

    events = await evaluate_alerts(session.id, db)
    assert len(events) == 1
    assert events[0].metric_name == "avg_latency_ms"
    assert "Latency" in events[0].message


@pytest.mark.asyncio
async def test_multiple_thresholds(db):
    session = await _create_session(db)
    db.add(SpeedTestResult(
        test_session_id=session.id,
        download_mbps=10.0,
        upload_mbps=2.0,
        timestamp=datetime.now(timezone.utc),
    ))
    db.add(AlertThreshold(metric_name="download_mbps", condition="lt", threshold_value=25.0, enabled=True, cooldown_minutes=30))
    db.add(AlertThreshold(metric_name="upload_mbps", condition="lt", threshold_value=5.0, enabled=True, cooldown_minutes=30))
    await db.commit()

    events = await evaluate_alerts(session.id, db)
    assert len(events) == 2
    metric_names = {e.metric_name for e in events}
    assert metric_names == {"download_mbps", "upload_mbps"}


@pytest.mark.asyncio
async def test_wifi_signal_alert(db):
    session = await _create_session(db)
    db.add(WiFiSnapshot(
        test_session_id=session.id,
        signal_pct=30,
        timestamp=datetime.now(timezone.utc),
    ))
    db.add(AlertThreshold(metric_name="signal_pct", condition="lt", threshold_value=40.0, enabled=True, cooldown_minutes=30))
    await db.commit()

    events = await evaluate_alerts(session.id, db)
    assert len(events) == 1
    assert events[0].metric_name == "signal_pct"
