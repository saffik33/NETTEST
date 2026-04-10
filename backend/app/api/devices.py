from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.device_scan import DeviceScan
from app.schemas.device_scan import DeviceScanDetailOut, DeviceScanOut, DiscoveredDeviceOut
from app.services.device_scan_service import scan_devices

router = APIRouter(prefix="/devices", tags=["devices"])


@router.get("/current")
async def devices_current():
    scan_data = await scan_devices()
    return {
        "devices": [
            {
                "ip_address": d.ip_address,
                "mac_address": d.mac_address,
                "hostname": d.hostname,
                "vendor": d.vendor,
                "entry_type": d.entry_type,
            }
            for d in scan_data.devices
        ],
        "count": scan_data.device_count,
    }


@router.get("/history", response_model=list[DeviceScanOut])
async def devices_history(limit: int = 20, offset: int = 0, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(DeviceScan).order_by(DeviceScan.timestamp.desc()).offset(offset).limit(limit)
    )
    return result.scalars().all()


@router.get("/scans/{scan_id}", response_model=DeviceScanDetailOut)
async def scan_detail(scan_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(DeviceScan)
        .options(selectinload(DeviceScan.devices))
        .where(DeviceScan.id == scan_id)
    )
    scan = result.scalar_one_or_none()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan
