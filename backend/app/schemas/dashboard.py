from pydantic import BaseModel


class SpeedSummary(BaseModel):
    avg_download: float
    avg_upload: float
    max_download: float
    test_count: int


class PingSummary(BaseModel):
    avg_latency: float
    avg_jitter: float
    avg_packet_loss: float


class DashboardSummaryResponse(BaseModel):
    period: str
    speed: SpeedSummary
    ping: PingSummary


class HealthScoreBreakdown(BaseModel):
    download: float | None
    upload: float | None
    latency: float | None
    jitter: float | None
    packet_loss: float | None
    wifi_signal: float | None


class HealthScoreResponse(BaseModel):
    overall: float | None = None
    breakdown: HealthScoreBreakdown | None = None
    trend_pct: float | None = None
    period: str
    score: float | None = None
    message: str | None = None
