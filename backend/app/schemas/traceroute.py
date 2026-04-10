from datetime import datetime

from pydantic import BaseModel


class TracerouteHopOut(BaseModel):
    id: int
    hop_number: int
    ip_address: str | None
    hostname: str | None
    rtt1_ms: float | None
    rtt2_ms: float | None
    rtt3_ms: float | None
    timed_out: bool

    model_config = {"from_attributes": True}


class TracerouteResultOut(BaseModel):
    id: int
    test_session_id: int
    target_host: str
    total_hops: int
    completed: bool
    timestamp: datetime

    model_config = {"from_attributes": True}


class TracerouteDetailOut(TracerouteResultOut):
    hops: list[TracerouteHopOut] = []


class TracerouteRunRequest(BaseModel):
    target: str = "8.8.8.8"
    max_hops: int = 30
