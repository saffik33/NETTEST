import asyncio
import logging
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.ws_manager import WebSocketManager
from app.database import AsyncSessionLocal
from app.models.dns_test import DNSResult
from app.models.device_scan import DeviceScan, DiscoveredDevice
from app.models.ping_test import PingResult
from app.models.speed_test import SpeedTestResult
from app.models.test_session import TestSession, TestStatus
from app.models.traceroute import TracerouteHop, TracerouteResult
from app.models.wifi_info import WiFiSnapshot
from app.services.alert_service import evaluate_alerts
from app.services.device_scan_service import scan_devices
from app.services.dns_service import run_dns_test
from app.services.notification_service import send_notifications
from app.services.ping_service import run_ping_test
from app.services.speed_test_service import run_speed_test
from app.services.traceroute_service import run_traceroute
from app.services.wifi_service import get_wifi_info

logger = logging.getLogger(__name__)

# Shared lock to prevent concurrent test sessions (used by api/tests.py and scheduler_service.py)
test_lock = asyncio.Lock()


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def run_full_test(
    session_id: int,
    db: AsyncSession,
    ws_manager: WebSocketManager,
    trigger_type: str = "manual",
    include_speed: bool = True,
    include_ping: bool = True,
    include_dns: bool = True,
    include_wifi: bool = True,
    include_traceroute: bool = False,
    include_device_scan: bool = False,
) -> None:
    errors: list[str] = []

    try:
        await ws_manager.broadcast({
            "type": "test_started",
            "timestamp": _now_iso(),
            "payload": {"session_id": session_id, "trigger_type": trigger_type},
        })

        # Phase 1: Speed test (sequential - needs full bandwidth)
        if include_speed:
            try:
                await ws_manager.broadcast({
                    "type": "test_phase_started",
                    "timestamp": _now_iso(),
                    "payload": {"session_id": session_id, "phase": "speed", "description": "Running speed test..."},
                })

                async def speed_progress(phase: str, progress: float):
                    await ws_manager.broadcast({
                        "type": "speed_progress",
                        "timestamp": _now_iso(),
                        "payload": {"session_id": session_id, "phase": phase, "progress_pct": progress},
                    })

                speed_data = await run_speed_test(progress_callback=speed_progress)

                db.add(SpeedTestResult(
                    test_session_id=session_id,
                    download_mbps=speed_data.download_mbps,
                    upload_mbps=speed_data.upload_mbps,
                    server_name=speed_data.server_name,
                    server_host=speed_data.server_host,
                    server_id=speed_data.server_id,
                    timestamp=datetime.now(timezone.utc),
                ))
                await db.commit()

                await ws_manager.broadcast({
                    "type": "test_phase_completed",
                    "timestamp": _now_iso(),
                    "payload": {
                        "session_id": session_id,
                        "phase": "speed",
                        "result": {"download_mbps": speed_data.download_mbps, "upload_mbps": speed_data.upload_mbps},
                    },
                })
            except Exception as e:
                logger.error("Phase 'speed' failed for session %d: %s", session_id, e, exc_info=True)
                errors.append(f"speed: {e}")

        # Phase 2: Concurrent - ping, dns, wifi (each with own DB session)
        phase2_tasks = []

        if include_ping:
            phase2_tasks.append(_run_ping_phase(session_id, ws_manager, errors))
        if include_dns:
            phase2_tasks.append(_run_dns_phase(session_id, ws_manager, errors))
        if include_wifi:
            phase2_tasks.append(_run_wifi_phase(session_id, ws_manager, errors))

        if phase2_tasks:
            await asyncio.gather(*phase2_tasks)

        # Phase 3: Traceroute (sequential)
        if include_traceroute:
            await _run_traceroute_phase(session_id, db, ws_manager, errors)

        # Phase 4: Device scan
        if include_device_scan:
            await _run_device_scan_phase(session_id, db, ws_manager, errors)

        # Update session status
        session = await db.get(TestSession, session_id)
        if session:
            session.completed_at = datetime.now(timezone.utc)
            session.status = TestStatus.PARTIAL if errors else TestStatus.COMPLETED
            if errors:
                session.error_message = "; ".join(errors)
            await db.commit()

        # Phase 5: Evaluate alert thresholds
        try:
            triggered_events = await evaluate_alerts(session_id, db)
            for event in triggered_events:
                threshold = event.threshold
                if threshold is None:
                    from app.models.alert_config import AlertThreshold
                    threshold = await db.get(AlertThreshold, event.threshold_id)
                if threshold:
                    await send_notifications(
                        event,
                        notify_browser_flag=threshold.notify_browser,
                        notify_email_flag=threshold.notify_email,
                        email_address=threshold.email_address,
                    )
            if triggered_events:
                await db.commit()
        except Exception as e:
            logger.error("Alert evaluation failed for session %d: %s", session_id, e, exc_info=True)

        await ws_manager.broadcast({
            "type": "test_completed",
            "timestamp": _now_iso(),
            "payload": {"session_id": session_id, "status": session.status if session else "completed"},
        })

    except Exception as e:
        logger.error("Test session %d failed: %s", session_id, e, exc_info=True)
        try:
            session = await db.get(TestSession, session_id)
            if session:
                session.status = TestStatus.FAILED
                session.error_message = str(e)
                session.completed_at = datetime.now(timezone.utc)
                await db.commit()
        except Exception as db_err:
            logger.error("Failed to update session status: %s", db_err)

        try:
            await ws_manager.broadcast({
                "type": "test_failed",
                "timestamp": _now_iso(),
                "payload": {"session_id": session_id, "error": str(e)},
            })
        except Exception as ws_err:
            logger.error("Failed to broadcast test failure: %s", ws_err)


async def _run_ping_phase(session_id: int, ws: WebSocketManager, errors: list[str]):
    try:
        await ws.broadcast({
            "type": "test_phase_started",
            "timestamp": _now_iso(),
            "payload": {"session_id": session_id, "phase": "ping", "description": "Running ping test..."},
        })

        async def ping_progress(completed: int, total: int, rtt: float):
            await ws.broadcast({
                "type": "ping_progress",
                "timestamp": _now_iso(),
                "payload": {"session_id": session_id, "completed": completed, "total": total, "last_rtt_ms": rtt},
            })

        ping_data = await run_ping_test(
            target=settings.DEFAULT_PING_TARGET,
            count=20,
            progress_callback=ping_progress,
        )

        async with AsyncSessionLocal() as db:
            db.add(PingResult(
                test_session_id=session_id,
                target_host=ping_data.target_host,
                avg_latency_ms=ping_data.avg_latency_ms,
                min_latency_ms=ping_data.min_latency_ms,
                max_latency_ms=ping_data.max_latency_ms,
                jitter_ms=ping_data.jitter_ms,
                packet_loss_pct=ping_data.packet_loss_pct,
                packets_sent=ping_data.packets_sent,
                packets_received=ping_data.packets_received,
                timestamp=datetime.now(timezone.utc),
            ))
            await db.commit()

        await ws.broadcast({
            "type": "test_phase_completed",
            "timestamp": _now_iso(),
            "payload": {
                "session_id": session_id,
                "phase": "ping",
                "result": {
                    "avg_latency_ms": ping_data.avg_latency_ms,
                    "jitter_ms": ping_data.jitter_ms,
                    "packet_loss_pct": ping_data.packet_loss_pct,
                },
            },
        })
    except Exception as e:
        logger.error("Phase 'ping' failed for session %d: %s", session_id, e, exc_info=True)
        errors.append(f"ping: {e}")


async def _run_dns_phase(session_id: int, ws: WebSocketManager, errors: list[str]):
    try:
        await ws.broadcast({
            "type": "test_phase_started",
            "timestamp": _now_iso(),
            "payload": {"session_id": session_id, "phase": "dns", "description": "Testing DNS resolution..."},
        })

        dns_results = await run_dns_test(domains=settings.dns_targets_list)

        async with AsyncSessionLocal() as db:
            for dns_data in dns_results:
                db.add(DNSResult(
                    test_session_id=session_id,
                    target_domain=dns_data.target_domain,
                    resolution_time_ms=dns_data.resolution_time_ms,
                    resolved_ip=dns_data.resolved_ip,
                    dns_server=dns_data.dns_server,
                    success=dns_data.success,
                    timestamp=datetime.now(timezone.utc),
                ))
            await db.commit()

        await ws.broadcast({
            "type": "test_phase_completed",
            "timestamp": _now_iso(),
            "payload": {
                "session_id": session_id,
                "phase": "dns",
                "result": {"domains_tested": len(dns_results)},
            },
        })
    except Exception as e:
        logger.error("Phase 'dns' failed for session %d: %s", session_id, e, exc_info=True)
        errors.append(f"dns: {e}")


async def _run_wifi_phase(session_id: int, ws: WebSocketManager, errors: list[str]):
    try:
        await ws.broadcast({
            "type": "test_phase_started",
            "timestamp": _now_iso(),
            "payload": {"session_id": session_id, "phase": "wifi", "description": "Scanning WiFi info..."},
        })

        wifi_data = await get_wifi_info()

        if wifi_data:
            async with AsyncSessionLocal() as db:
                db.add(WiFiSnapshot(
                    test_session_id=session_id,
                    ssid=wifi_data.ssid,
                    bssid=wifi_data.bssid,
                    rssi_dbm=wifi_data.rssi_dbm,
                    signal_pct=wifi_data.signal_pct,
                    channel=wifi_data.channel,
                    band=wifi_data.band,
                    radio_type=wifi_data.radio_type,
                    auth_type=wifi_data.auth_type,
                    rx_rate_mbps=wifi_data.rx_rate_mbps,
                    tx_rate_mbps=wifi_data.tx_rate_mbps,
                    channel_utilization_pct=wifi_data.channel_utilization_pct,
                    timestamp=datetime.now(timezone.utc),
                ))
                await db.commit()

        await ws.broadcast({
            "type": "test_phase_completed",
            "timestamp": _now_iso(),
            "payload": {
                "session_id": session_id,
                "phase": "wifi",
                "result": {"signal_pct": wifi_data.signal_pct if wifi_data else None},
            },
        })
    except Exception as e:
        logger.error("Phase 'wifi' failed for session %d: %s", session_id, e, exc_info=True)
        errors.append(f"wifi: {e}")


async def _run_traceroute_phase(session_id: int, db: AsyncSession, ws: WebSocketManager, errors: list[str]):
    try:
        await ws.broadcast({
            "type": "test_phase_started",
            "timestamp": _now_iso(),
            "payload": {"session_id": session_id, "phase": "traceroute", "description": "Running traceroute..."},
        })

        async def hop_callback(hop):
            await ws.broadcast({
                "type": "traceroute_hop",
                "timestamp": _now_iso(),
                "payload": {
                    "session_id": session_id,
                    "hop": {
                        "hop_number": hop.hop_number,
                        "ip_address": hop.ip_address,
                        "rtt1_ms": hop.rtt1_ms,
                        "rtt2_ms": hop.rtt2_ms,
                        "rtt3_ms": hop.rtt3_ms,
                        "timed_out": hop.timed_out,
                    },
                },
            })

        trace_data = await run_traceroute(
            target=settings.DEFAULT_TRACEROUTE_TARGET,
            max_hops=30,
            progress_callback=hop_callback,
        )

        tr = TracerouteResult(
            test_session_id=session_id,
            target_host=trace_data.target_host,
            total_hops=trace_data.total_hops,
            completed=trace_data.completed,
            timestamp=datetime.now(timezone.utc),
        )
        db.add(tr)
        await db.flush()

        for hop in trace_data.hops:
            db.add(TracerouteHop(
                traceroute_id=tr.id,
                hop_number=hop.hop_number,
                ip_address=hop.ip_address,
                hostname=hop.hostname,
                rtt1_ms=hop.rtt1_ms,
                rtt2_ms=hop.rtt2_ms,
                rtt3_ms=hop.rtt3_ms,
                timed_out=hop.timed_out,
            ))
        await db.commit()

        await ws.broadcast({
            "type": "test_phase_completed",
            "timestamp": _now_iso(),
            "payload": {"session_id": session_id, "phase": "traceroute", "result": {"total_hops": trace_data.total_hops}},
        })
    except Exception as e:
        logger.error("Phase 'traceroute' failed for session %d: %s", session_id, e, exc_info=True)
        errors.append(f"traceroute: {e}")


async def _run_device_scan_phase(session_id: int, db: AsyncSession, ws: WebSocketManager, errors: list[str]):
    try:
        await ws.broadcast({
            "type": "test_phase_started",
            "timestamp": _now_iso(),
            "payload": {"session_id": session_id, "phase": "device_scan", "description": "Scanning devices..."},
        })

        scan_data = await scan_devices()

        scan = DeviceScan(
            test_session_id=session_id,
            device_count=scan_data.device_count,
            timestamp=datetime.now(timezone.utc),
        )
        db.add(scan)
        await db.flush()

        for dev in scan_data.devices:
            db.add(DiscoveredDevice(
                scan_id=scan.id,
                ip_address=dev.ip_address,
                mac_address=dev.mac_address,
                hostname=dev.hostname,
                vendor=dev.vendor,
                entry_type=dev.entry_type,
            ))
        await db.commit()

        await ws.broadcast({
            "type": "test_phase_completed",
            "timestamp": _now_iso(),
            "payload": {"session_id": session_id, "phase": "device_scan", "result": {"device_count": scan_data.device_count}},
        })
    except Exception as e:
        logger.error("Phase 'device_scan' failed for session %d: %s", session_id, e, exc_info=True)
        errors.append(f"device_scan: {e}")
