import logging

from aiosmtplib import send as smtp_send
from email.message import EmailMessage

from app.config import settings
from app.core.ws_manager import ws_manager
from app.models.alert_event import AlertEvent

logger = logging.getLogger(__name__)


async def notify_browser(event: AlertEvent) -> None:
    """Push alert event to all connected WebSocket clients."""
    try:
        await ws_manager.broadcast({
            "type": "alert_triggered",
            "payload": {
                "id": event.id,
                "metric_name": event.metric_name,
                "metric_value": event.metric_value,
                "threshold_value": event.threshold_value,
                "condition": event.condition,
                "message": event.message,
                "triggered_at": event.triggered_at.isoformat(),
            },
        })
        event.notified_browser = True
    except Exception as e:
        logger.error("Failed to send browser notification: %s", e)


async def notify_email(event: AlertEvent, to_address: str) -> None:
    """Send alert via SMTP email."""
    if not settings.SMTP_HOST or not settings.SMTP_FROM_EMAIL:
        logger.warning("SMTP not configured, skipping email notification")
        return

    try:
        msg = EmailMessage()
        msg["Subject"] = f"NetTest Alert: {event.metric_name}"
        msg["From"] = settings.SMTP_FROM_EMAIL
        msg["To"] = to_address
        msg.set_content(
            f"Alert triggered!\n\n"
            f"{event.message}\n\n"
            f"Metric: {event.metric_name}\n"
            f"Value: {event.metric_value}\n"
            f"Threshold: {event.threshold_value}\n"
            f"Time: {event.triggered_at.isoformat()}\n"
        )

        await smtp_send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USERNAME or None,
            password=settings.SMTP_PASSWORD or None,
            start_tls=settings.SMTP_USE_TLS,
        )
        event.notified_email = True
        logger.info("Email alert sent to %s for %s", to_address, event.metric_name)
    except Exception as e:
        logger.error("Failed to send email notification: %s", e)


async def send_notifications(event: AlertEvent, notify_browser_flag: bool, notify_email_flag: bool, email_address: str | None) -> None:
    """Send all configured notifications for an alert event."""
    if notify_browser_flag:
        await notify_browser(event)

    if notify_email_flag and email_address:
        await notify_email(event, email_address)
