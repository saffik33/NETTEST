from datetime import datetime

from pydantic import BaseModel


class DNSResultOut(BaseModel):
    id: int
    test_session_id: int
    target_domain: str
    resolution_time_ms: float
    resolved_ip: str | None
    dns_server: str | None
    success: bool
    timestamp: datetime

    model_config = {"from_attributes": True}
