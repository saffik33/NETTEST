from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class TestProfile(Base):
    __tablename__ = "test_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # Targets (JSON-encoded lists)
    ping_targets: Mapped[str] = mapped_column(Text, nullable=False, default='["8.8.8.8"]')
    dns_targets: Mapped[str] = mapped_column(Text, nullable=False, default='["google.com","cloudflare.com","github.com"]')
    traceroute_target: Mapped[str] = mapped_column(String(255), nullable=False, default="8.8.8.8")
    # Which tests to include
    include_speed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    include_ping: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    include_dns: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    include_wifi: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    include_traceroute: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    include_device_scan: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    # Metadata
    is_default: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
