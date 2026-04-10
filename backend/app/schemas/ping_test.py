from datetime import datetime

from pydantic import BaseModel


class PingResultOut(BaseModel):
    id: int
    test_session_id: int
    target_host: str
    avg_latency_ms: float
    min_latency_ms: float
    max_latency_ms: float
    jitter_ms: float
    packet_loss_pct: float
    packets_sent: int
    packets_received: int
    timestamp: datetime

    model_config = {"from_attributes": True}
