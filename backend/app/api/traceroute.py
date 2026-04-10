import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.test_session import TestSession, TestStatus, TriggerType
from app.models.traceroute import TracerouteHop, TracerouteResult
from app.schemas.traceroute import TracerouteDetailOut, TracerouteResultOut
from app.services.geo_service import geolocate_batch
from app.services.traceroute_service import run_traceroute

logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/traceroute", tags=["traceroute"])


class TracerouteRunRequest(BaseModel):
    target: str = "8.8.8.8"


@router.post("/run")
@limiter.limit("5/minute")
async def run_traceroute_standalone(request: TracerouteRunRequest, req: Request, db: AsyncSession = Depends(get_db)):
    """Run a standalone traceroute to a target host."""
    # Create a minimal test session to satisfy the FK constraint
    session = TestSession(trigger_type=TriggerType.MANUAL, status=TestStatus.RUNNING)
    db.add(session)
    await db.flush()

    try:
        data = await run_traceroute(target=request.target, max_hops=30)

        tr = TracerouteResult(
            test_session_id=session.id,
            target_host=data.target_host,
            total_hops=data.total_hops,
            completed=data.completed,
        )
        db.add(tr)
        await db.flush()

        for hop in data.hops:
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

        session.status = TestStatus.COMPLETED
        session.completed_at = datetime.now(timezone.utc)
        await db.commit()

        return {"traceroute_id": tr.id, "target": data.target_host, "total_hops": data.total_hops, "completed": data.completed}
    except Exception as e:
        session.status = TestStatus.FAILED
        session.error_message = str(e)
        await db.commit()
        logger.error("Standalone traceroute failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Traceroute failed: {e}")


@router.get("/history", response_model=list[TracerouteResultOut])
async def traceroute_history(limit: int = 20, offset: int = 0, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(TracerouteResult).order_by(TracerouteResult.timestamp.desc()).offset(offset).limit(limit)
    )
    return result.scalars().all()


@router.get("/{traceroute_id}", response_model=TracerouteDetailOut)
async def traceroute_detail(traceroute_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(TracerouteResult)
        .options(selectinload(TracerouteResult.hops))
        .where(TracerouteResult.id == traceroute_id)
    )
    tr = result.scalar_one_or_none()
    if not tr:
        raise HTTPException(status_code=404, detail="Traceroute not found")
    return tr


@router.get("/{traceroute_id}/map")
async def traceroute_map(traceroute_id: int, db: AsyncSession = Depends(get_db)):
    """Get traceroute hops with geolocation data for map visualization."""
    result = await db.execute(
        select(TracerouteResult)
        .options(selectinload(TracerouteResult.hops))
        .where(TracerouteResult.id == traceroute_id)
    )
    tr = result.scalar_one_or_none()
    if not tr:
        raise HTTPException(status_code=404, detail="Traceroute not found")

    # Collect all IPs for batch geolocation
    ips = [hop.ip_address for hop in tr.hops if hop.ip_address and not hop.timed_out]
    geo_map = await geolocate_batch(ips)

    hops = []
    for hop in tr.hops:
        geo = geo_map.get(hop.ip_address) if hop.ip_address else None
        avg_rtt = None
        rtts = [r for r in [hop.rtt1_ms, hop.rtt2_ms, hop.rtt3_ms] if r is not None]
        if rtts:
            avg_rtt = round(sum(rtts) / len(rtts), 2)

        hops.append({
            "hop_number": hop.hop_number,
            "ip_address": hop.ip_address,
            "hostname": hop.hostname,
            "avg_rtt_ms": avg_rtt,
            "timed_out": hop.timed_out,
            "geo": {
                "lat": geo.lat,
                "lon": geo.lon,
                "city": geo.city,
                "country": geo.country,
                "isp": geo.isp,
                "asn": geo.asn,
            } if geo else None,
        })

    return {
        "id": tr.id,
        "target_host": tr.target_host,
        "total_hops": tr.total_hops,
        "completed": tr.completed,
        "timestamp": tr.timestamp.isoformat(),
        "hops": hops,
    }
