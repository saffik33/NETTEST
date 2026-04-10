import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.test_profile import TestProfile
from app.schemas.test_profile import TestProfileCreate, TestProfileOut, TestProfileUpdate

router = APIRouter(prefix="/profiles", tags=["profiles"])


def _model_to_out(profile: TestProfile) -> TestProfileOut:
    return TestProfileOut(
        id=profile.id,
        name=profile.name,
        description=profile.description,
        ping_targets=json.loads(profile.ping_targets),
        dns_targets=json.loads(profile.dns_targets),
        traceroute_target=profile.traceroute_target,
        include_speed=profile.include_speed,
        include_ping=profile.include_ping,
        include_dns=profile.include_dns,
        include_wifi=profile.include_wifi,
        include_traceroute=profile.include_traceroute,
        include_device_scan=profile.include_device_scan,
        is_default=profile.is_default,
        created_at=profile.created_at,
    )


@router.get("", response_model=list[TestProfileOut])
async def list_profiles(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TestProfile).order_by(TestProfile.name))
    return [_model_to_out(p) for p in result.scalars().all()]


@router.post("", response_model=TestProfileOut)
async def create_profile(data: TestProfileCreate, db: AsyncSession = Depends(get_db)):
    profile = TestProfile(
        name=data.name,
        description=data.description,
        ping_targets=json.dumps(data.ping_targets),
        dns_targets=json.dumps(data.dns_targets),
        traceroute_target=data.traceroute_target,
        include_speed=data.include_speed,
        include_ping=data.include_ping,
        include_dns=data.include_dns,
        include_wifi=data.include_wifi,
        include_traceroute=data.include_traceroute,
        include_device_scan=data.include_device_scan,
        is_default=data.is_default,
    )

    # If setting as default, unset other defaults
    if data.is_default:
        existing = await db.execute(select(TestProfile).where(TestProfile.is_default == True))
        for p in existing.scalars().all():
            p.is_default = False

    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return _model_to_out(profile)


@router.put("/{profile_id}", response_model=TestProfileOut)
async def update_profile(profile_id: int, data: TestProfileUpdate, db: AsyncSession = Depends(get_db)):
    profile = await db.get(TestProfile, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    update_data = data.model_dump(exclude_unset=True)

    if "ping_targets" in update_data:
        update_data["ping_targets"] = json.dumps(update_data["ping_targets"])
    if "dns_targets" in update_data:
        update_data["dns_targets"] = json.dumps(update_data["dns_targets"])

    # If setting as default, unset others
    if update_data.get("is_default"):
        existing = await db.execute(
            select(TestProfile).where(TestProfile.is_default == True, TestProfile.id != profile_id)
        )
        for p in existing.scalars().all():
            p.is_default = False

    for key, value in update_data.items():
        setattr(profile, key, value)

    await db.commit()
    await db.refresh(profile)
    return _model_to_out(profile)


@router.delete("/{profile_id}", status_code=204)
async def delete_profile(profile_id: int, db: AsyncSession = Depends(get_db)):
    profile = await db.get(TestProfile, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    await db.delete(profile)
    await db.commit()
