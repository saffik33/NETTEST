from datetime import datetime

from pydantic import BaseModel


class DiscoveredDeviceOut(BaseModel):
    id: int
    ip_address: str
    mac_address: str
    hostname: str | None
    vendor: str | None
    entry_type: str

    model_config = {"from_attributes": True}


class DeviceScanOut(BaseModel):
    id: int
    test_session_id: int | None
    device_count: int
    timestamp: datetime

    model_config = {"from_attributes": True}


class DeviceScanDetailOut(DeviceScanOut):
    devices: list[DiscoveredDeviceOut] = []
