from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.speed_test import SpeedTestResult
from app.schemas.speed_test import SpeedTestResultOut

router = APIRouter(prefix="/speed", tags=["speed"])


@router.get("/history", response_model=list[SpeedTestResultOut])
async def speed_history(limit: int = 100, offset: int = 0, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(SpeedTestResult).order_by(SpeedTestResult.timestamp.desc()).offset(offset).limit(limit)
    )
    return result.scalars().all()


@router.get("/latest", response_model=SpeedTestResultOut | None)
async def speed_latest(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(SpeedTestResult).order_by(SpeedTestResult.timestamp.desc()).limit(1)
    )
    return result.scalar_one_or_none()


@router.get("/stats")
async def speed_stats(period: str = "24h", db: AsyncSession = Depends(get_db)):
    from datetime import datetime, timedelta, timezone

    period_map = {"24h": 1, "7d": 7, "30d": 30, "all": 36500}
    days = period_map.get(period, 1)
    since = datetime.now(timezone.utc) - timedelta(days=days)

    result = await db.execute(
        select(
            func.avg(SpeedTestResult.download_mbps).label("avg_download"),
            func.avg(SpeedTestResult.upload_mbps).label("avg_upload"),
            func.min(SpeedTestResult.download_mbps).label("min_download"),
            func.max(SpeedTestResult.download_mbps).label("max_download"),
            func.min(SpeedTestResult.upload_mbps).label("min_upload"),
            func.max(SpeedTestResult.upload_mbps).label("max_upload"),
            func.count().label("test_count"),
        ).where(SpeedTestResult.timestamp >= since)
    )
    row = result.one()
    return {
        "avg_download": round(row.avg_download or 0, 2),
        "avg_upload": round(row.avg_upload or 0, 2),
        "min_download": round(row.min_download or 0, 2),
        "max_download": round(row.max_download or 0, 2),
        "min_upload": round(row.min_upload or 0, 2),
        "max_upload": round(row.max_upload or 0, 2),
        "test_count": row.test_count,
    }
