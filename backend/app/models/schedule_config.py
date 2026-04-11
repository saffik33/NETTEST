from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ScheduleConfig(Base):
    __tablename__ = "schedule_configs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    interval_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    include_speed_test: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    include_ping_test: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    include_dns_test: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    include_wifi_scan: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    include_traceroute: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    include_device_scan: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
