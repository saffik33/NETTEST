from datetime import datetime

from pydantic import BaseModel


class SpeedTestResultOut(BaseModel):
    id: int
    test_session_id: int
    download_mbps: float
    upload_mbps: float
    server_name: str | None
    server_host: str | None
    server_id: int | None
    timestamp: datetime

    model_config = {"from_attributes": True}
