from datetime import datetime

from pydantic import BaseModel


class WSMessage(BaseModel):
    type: str
    timestamp: datetime
    payload: dict
