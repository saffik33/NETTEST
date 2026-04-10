from datetime import datetime

from pydantic import BaseModel


class WiFiSnapshotOut(BaseModel):
    id: int
    test_session_id: int | None
    ssid: str | None
    bssid: str | None
    rssi_dbm: int | None
    signal_pct: int | None
    channel: int | None
    band: str | None
    radio_type: str | None
    auth_type: str | None
    rx_rate_mbps: float | None
    tx_rate_mbps: float | None
    channel_utilization_pct: float | None
    timestamp: datetime

    model_config = {"from_attributes": True}


class WiFiCurrentOut(BaseModel):
    ssid: str | None = None
    bssid: str | None = None
    rssi_dbm: int | None = None
    signal_pct: int | None = None
    channel: int | None = None
    band: str | None = None
    radio_type: str | None = None
    auth_type: str | None = None
    rx_rate_mbps: float | None = None
    tx_rate_mbps: float | None = None


class WiFiNetworkOut(BaseModel):
    ssid: str
    bssid: str
    signal_pct: int
    channel: int | None
    band: str | None
