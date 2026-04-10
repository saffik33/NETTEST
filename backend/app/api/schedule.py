from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.schedule_config import ScheduleConfig
from app.schemas.schedule import ScheduleConfigCreate, ScheduleConfigOut, ScheduleConfigUpdate
from app.services.scheduler_service import add_schedule_job, remove_schedule_job

router = APIRouter(prefix="/schedule", tags=["schedule"])


@router.get("", response_model=list[ScheduleConfigOut])
async def list_schedules(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ScheduleConfig))
    return result.scalars().all()


@router.post("", response_model=ScheduleConfigOut)
async def create_schedule(data: ScheduleConfigCreate, db: AsyncSession = Depends(get_db)):
    config = ScheduleConfig(**data.model_dump())
    db.add(config)
    await db.commit()
    await db.refresh(config)
    if config.enabled:
        add_schedule_job(config.id, config.interval_minutes)
    return config


@router.put("/{schedule_id}", response_model=ScheduleConfigOut)
async def update_schedule(schedule_id: int, data: ScheduleConfigUpdate, db: AsyncSession = Depends(get_db)):
    config = await db.get(ScheduleConfig, schedule_id)
    if not config:
        raise HTTPException(status_code=404, detail="Schedule not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(config, key, value)
    await db.commit()
    await db.refresh(config)
    if config.enabled:
        add_schedule_job(config.id, config.interval_minutes)
    else:
        remove_schedule_job(config.id)
    return config


@router.delete("/{schedule_id}", status_code=204)
async def delete_schedule(schedule_id: int, db: AsyncSession = Depends(get_db)):
    config = await db.get(ScheduleConfig, schedule_id)
    if not config:
        raise HTTPException(status_code=404, detail="Schedule not found")
    remove_schedule_job(config.id)
    await db.delete(config)
    await db.commit()
