from datetime import datetime

from pydantic import BaseModel, Field


class TestProfileCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = None
    ping_targets: list[str] = ["8.8.8.8"]
    dns_targets: list[str] = ["google.com", "cloudflare.com", "github.com"]
    traceroute_target: str = "8.8.8.8"
    include_speed: bool = True
    include_ping: bool = True
    include_dns: bool = True
    include_wifi: bool = True
    include_traceroute: bool = False
    include_device_scan: bool = False
    is_default: bool = False


class TestProfileUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = None
    ping_targets: list[str] | None = None
    dns_targets: list[str] | None = None
    traceroute_target: str | None = None
    include_speed: bool | None = None
    include_ping: bool | None = None
    include_dns: bool | None = None
    include_wifi: bool | None = None
    include_traceroute: bool | None = None
    include_device_scan: bool | None = None
    is_default: bool | None = None


class TestProfileOut(BaseModel):
    id: int
    name: str
    description: str | None
    ping_targets: list[str]
    dns_targets: list[str]
    traceroute_target: str
    include_speed: bool
    include_ping: bool
    include_dns: bool
    include_wifi: bool
    include_traceroute: bool
    include_device_scan: bool
    is_default: bool
    created_at: datetime
