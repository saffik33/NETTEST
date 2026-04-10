from datetime import datetime

from pydantic import BaseModel


class TestRunRequest(BaseModel):
    include_speed: bool = True
    include_ping: bool = True
    include_dns: bool = True
    include_wifi: bool = True
    include_traceroute: bool = False
    include_device_scan: bool = False


class TestRunResponse(BaseModel):
    session_id: int
    status: str


class TestSessionOut(BaseModel):
    id: int
    started_at: datetime
    completed_at: datetime | None
    trigger_type: str
    status: str
    error_message: str | None

    model_config = {"from_attributes": True}
