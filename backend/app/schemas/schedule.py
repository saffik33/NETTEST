from datetime import datetime

from pydantic import BaseModel, Field


class ScheduleConfigCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    interval_minutes: int = Field(gt=0)
    enabled: bool = True
    include_speed_test: bool = True
    include_ping_test: bool = True
    include_dns_test: bool = True
    include_wifi_scan: bool = True
    include_traceroute: bool = False
    include_device_scan: bool = False


class ScheduleConfigUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    interval_minutes: int | None = Field(default=None, gt=0)
    enabled: bool | None = None
    include_speed_test: bool | None = None
    include_ping_test: bool | None = None
    include_dns_test: bool | None = None
    include_wifi_scan: bool | None = None
    include_traceroute: bool | None = None
    include_device_scan: bool | None = None


class ScheduleConfigOut(BaseModel):
    id: int
    name: str
    interval_minutes: int
    enabled: bool
    include_speed_test: bool
    include_ping_test: bool
    include_dns_test: bool
    include_wifi_scan: bool
    include_traceroute: bool
    include_device_scan: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
