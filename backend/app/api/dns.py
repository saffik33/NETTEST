from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.dns_test import DNSResult
from app.schemas.dns_test import DNSResultOut

router = APIRouter(prefix="/dns", tags=["dns"])


@router.get("/history", response_model=list[DNSResultOut])
async def dns_history(limit: int = 100, offset: int = 0, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(DNSResult).order_by(DNSResult.timestamp.desc()).offset(offset).limit(limit)
    )
    return result.scalars().all()


@router.get("/latest", response_model=list[DNSResultOut])
async def dns_latest(db: AsyncSession = Depends(get_db)):
    # Get the most recent test_session_id that has DNS results
    subq = select(DNSResult.test_session_id).order_by(DNSResult.timestamp.desc()).limit(1).scalar_subquery()
    result = await db.execute(
        select(DNSResult).where(DNSResult.test_session_id == subq)
    )
    return result.scalars().all()
