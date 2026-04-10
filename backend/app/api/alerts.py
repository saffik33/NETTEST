from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.alert_config import AlertThreshold
from app.models.alert_event import AlertEvent
from app.schemas.alert import AlertEventOut, AlertThresholdCreate, AlertThresholdOut, AlertThresholdUpdate

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("/thresholds", response_model=list[AlertThresholdOut])
async def list_thresholds(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AlertThreshold))
    return result.scalars().all()


@router.post("/thresholds", response_model=AlertThresholdOut)
async def create_threshold(data: AlertThresholdCreate, db: AsyncSession = Depends(get_db)):
    threshold = AlertThreshold(**data.model_dump())
    db.add(threshold)
    await db.commit()
    await db.refresh(threshold)
    return threshold


@router.put("/thresholds/{threshold_id}", response_model=AlertThresholdOut)
async def update_threshold(threshold_id: int, data: AlertThresholdUpdate, db: AsyncSession = Depends(get_db)):
    threshold = await db.get(AlertThreshold, threshold_id)
    if not threshold:
        raise HTTPException(status_code=404, detail="Threshold not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(threshold, key, value)
    await db.commit()
    await db.refresh(threshold)
    return threshold


@router.delete("/thresholds/{threshold_id}", status_code=204)
async def delete_threshold(threshold_id: int, db: AsyncSession = Depends(get_db)):
    threshold = await db.get(AlertThreshold, threshold_id)
    if not threshold:
        raise HTTPException(status_code=404, detail="Threshold not found")
    await db.delete(threshold)
    await db.commit()


@router.get("/events", response_model=list[AlertEventOut])
async def list_events(
    limit: int = 50,
    offset: int = 0,
    acknowledged: bool | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(AlertEvent).order_by(AlertEvent.triggered_at.desc()).offset(offset).limit(limit)
    if acknowledged is not None:
        query = query.where(AlertEvent.acknowledged == acknowledged)
    result = await db.execute(query)
    return result.scalars().all()


@router.put("/events/{event_id}/acknowledge", response_model=AlertEventOut)
async def acknowledge_event(event_id: int, db: AsyncSession = Depends(get_db)):
    event = await db.get(AlertEvent, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    event.acknowledged = True
    await db.commit()
    await db.refresh(event)
    return event


@router.put("/events/acknowledge-all")
async def acknowledge_all_events(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AlertEvent).where(AlertEvent.acknowledged == False))
    events = result.scalars().all()
    for event in events:
        event.acknowledged = True
    await db.commit()
    return {"count": len(events)}
