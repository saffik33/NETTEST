import logging
from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy import select

from app.core.ws_manager import ws_manager
from app.database import AsyncSessionLocal
from app.models.schedule_config import ScheduleConfig
from app.models.test_session import TestSession, TestStatus, TriggerType
from app.services.test_orchestrator import run_full_test, test_lock

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


def _job_id(schedule_id: int) -> str:
    return f"schedule_{schedule_id}"


async def _run_scheduled_test(schedule_id: int) -> None:
    """Execute a scheduled test session."""
    if test_lock.locked():
        logger.info("Skipping scheduled test %d — another test is running", schedule_id)
        return

    await test_lock.acquire()
    try:
        async with AsyncSessionLocal() as db:
            config = await db.get(ScheduleConfig, schedule_id)
            if not config or not config.enabled:
                logger.info("Schedule %d is disabled or deleted, skipping", schedule_id)
                return

            session = TestSession(
                started_at=datetime.now(timezone.utc),
                trigger_type=TriggerType.SCHEDULED,
                status=TestStatus.RUNNING,
            )
            db.add(session)
            await db.commit()
            await db.refresh(session)

            logger.info("Running scheduled test session %d for schedule '%s'", session.id, config.name)

            await run_full_test(
                session_id=session.id,
                db=db,
                ws_manager=ws_manager,
                trigger_type=TriggerType.SCHEDULED,
                include_speed=config.include_speed_test,
                include_ping=config.include_ping_test,
                include_dns=config.include_dns_test,
                include_wifi=config.include_wifi_scan,
                include_traceroute=config.include_traceroute,
                include_device_scan=config.include_device_scan,
            )
            logger.info("Scheduled test session %d completed", session.id)
    except Exception as e:
        logger.error("Scheduled test for schedule %d failed: %s", schedule_id, e, exc_info=True)
    finally:
        test_lock.release()


async def load_schedules() -> None:
    """Load all enabled schedules from DB and register APScheduler jobs."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(ScheduleConfig).where(ScheduleConfig.enabled == True)
        )
        configs = result.scalars().all()

    for config in configs:
        add_schedule_job(config.id, config.interval_minutes)
        logger.info("Loaded schedule '%s' (every %d min)", config.name, config.interval_minutes)


def add_schedule_job(schedule_id: int, interval_minutes: int) -> None:
    """Add or replace an APScheduler job for a schedule."""
    job_id = _job_id(schedule_id)

    if scheduler.get_job(job_id):
        scheduler.remove_job(job_id)

    scheduler.add_job(
        _run_scheduled_test,
        trigger=IntervalTrigger(minutes=interval_minutes),
        id=job_id,
        args=[schedule_id],
        max_instances=1,
        replace_existing=True,
    )
    logger.info("Added scheduler job %s (every %d min)", job_id, interval_minutes)


def remove_schedule_job(schedule_id: int) -> None:
    """Remove an APScheduler job."""
    job_id = _job_id(schedule_id)
    if scheduler.get_job(job_id):
        scheduler.remove_job(job_id)
        logger.info("Removed scheduler job %s", job_id)


def start_scheduler() -> None:
    """Start the APScheduler if not already running."""
    if not scheduler.running:
        scheduler.start()
        logger.info("Scheduler started")


def stop_scheduler() -> None:
    """Shut down the APScheduler."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped")
