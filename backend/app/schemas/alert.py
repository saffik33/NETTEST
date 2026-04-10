from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

VALID_METRICS = Literal["download_mbps", "upload_mbps", "avg_latency_ms", "jitter_ms", "packet_loss_pct", "signal_pct"]
VALID_CONDITIONS = Literal["lt", "gt"]


class AlertThresholdCreate(BaseModel):
    metric_name: VALID_METRICS
    condition: VALID_CONDITIONS
    threshold_value: float = Field(gt=0)
    enabled: bool = True
    notify_browser: bool = True
    notify_email: bool = False
    email_address: str | None = None
    cooldown_minutes: int = Field(default=30, gt=0)


class AlertThresholdUpdate(BaseModel):
    metric_name: VALID_METRICS | None = None
    condition: VALID_CONDITIONS | None = None
    threshold_value: float | None = Field(default=None, gt=0)
    enabled: bool | None = None
    notify_browser: bool | None = None
    notify_email: bool | None = None
    email_address: str | None = None
    cooldown_minutes: int | None = Field(default=None, gt=0)


class AlertThresholdOut(BaseModel):
    id: int
    metric_name: str
    condition: str
    threshold_value: float
    enabled: bool
    notify_browser: bool
    notify_email: bool
    email_address: str | None
    cooldown_minutes: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AlertEventOut(BaseModel):
    id: int
    threshold_id: int
    test_session_id: int | None
    metric_name: str
    metric_value: float
    threshold_value: float
    condition: str
    message: str
    notified_browser: bool
    notified_email: bool
    acknowledged: bool
    triggered_at: datetime

    model_config = {"from_attributes": True}
