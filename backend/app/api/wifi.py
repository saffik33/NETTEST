from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.wifi_info import WiFiSnapshot
from app.schemas.wifi_info import WiFiCurrentOut, WiFiNetworkOut, WiFiSnapshotOut
from app.services.channel_analyzer_service import analyze_channels
from app.services.wifi_service import get_wifi_info, get_wifi_networks

router = APIRouter(prefix="/wifi", tags=["wifi"])


@router.get("/current", response_model=WiFiCurrentOut | None)
async def wifi_current():
    data = await get_wifi_info()
    if not data:
        return None
    return WiFiCurrentOut(
        ssid=data.ssid,
        bssid=data.bssid,
        rssi_dbm=data.rssi_dbm,
        signal_pct=data.signal_pct,
        channel=data.channel,
        band=data.band,
        radio_type=data.radio_type,
        auth_type=data.auth_type,
        rx_rate_mbps=data.rx_rate_mbps,
        tx_rate_mbps=data.tx_rate_mbps,
    )


@router.get("/history", response_model=list[WiFiSnapshotOut])
async def wifi_history(limit: int = 100, offset: int = 0, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(WiFiSnapshot).order_by(WiFiSnapshot.timestamp.desc()).offset(offset).limit(limit)
    )
    return result.scalars().all()


@router.get("/channels", response_model=list[WiFiNetworkOut])
async def wifi_channels():
    networks = await get_wifi_networks()
    return [WiFiNetworkOut(
        ssid=n.ssid,
        bssid=n.bssid,
        signal_pct=n.signal_pct,
        channel=n.channel,
        band=n.band,
    ) for n in networks]


@router.get("/channel-analysis")
async def wifi_channel_analysis():
    analysis = await analyze_channels()
    return {
        "current_channel": analysis.current_channel,
        "current_band": analysis.current_band,
        "total_networks": analysis.total_networks,
        "channels": [
            {
                "channel": ch.channel,
                "band": ch.band,
                "network_count": ch.network_count,
                "networks": ch.networks,
                "avg_signal": ch.avg_signal,
                "congestion_score": ch.congestion_score,
            }
            for ch in analysis.channels
        ],
        "recommendations": [
            {
                "channel": r.channel,
                "band": r.band,
                "reason": r.reason,
                "congestion_score": r.congestion_score,
            }
            for r in analysis.recommendations
        ],
    }
