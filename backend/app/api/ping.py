from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.ping_test import PingResult
from app.schemas.ping_test import PingResultOut

router = APIRouter(prefix="/ping", tags=["ping"])


@router.get("/history", response_model=list[PingResultOut])
async def ping_history(limit: int = 100, offset: int = 0, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PingResult).order_by(PingResult.timestamp.desc()).offset(offset).limit(limit)
    )
    return result.scalars().all()


@router.get("/latest", response_model=PingResultOut | None)
async def ping_latest(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PingResult).order_by(PingResult.timestamp.desc()).limit(1))
    return result.scalar_one_or_none()


@router.get("/stats")
async def ping_stats(period: str = "24h", db: AsyncSession = Depends(get_db)):
    period_map = {"24h": 1, "7d": 7, "30d": 30, "all": 36500}
    days = period_map.get(period, 1)
    since = datetime.now(timezone.utc) - timedelta(days=days)

    result = await db.execute(
        select(
            func.avg(PingResult.avg_latency_ms).label("avg_latency"),
            func.avg(PingResult.jitter_ms).label("avg_jitter"),
            func.avg(PingResult.packet_loss_pct).label("avg_packet_loss"),
            func.min(PingResult.min_latency_ms).label("min_latency"),
            func.max(PingResult.max_latency_ms).label("max_latency"),
            func.count().label("test_count"),
        ).where(PingResult.timestamp >= since)
    )
    row = result.one()
    return {
        "avg_latency": round(row.avg_latency or 0, 2),
        "avg_jitter": round(row.avg_jitter or 0, 2),
        "avg_packet_loss": round(row.avg_packet_loss or 0, 2),
        "min_latency": round(row.min_latency or 0, 2),
        "max_latency": round(row.max_latency or 0, 2),
        "test_count": row.test_count,
    }
