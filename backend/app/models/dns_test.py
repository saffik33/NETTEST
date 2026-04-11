from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class DNSResult(Base):
    __tablename__ = "dns_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    test_session_id: Mapped[int] = mapped_column(Integer, ForeignKey("test_sessions.id"), nullable=False, index=True)
    target_domain: Mapped[str] = mapped_column(String(255), nullable=False)
    resolution_time_ms: Mapped[float] = mapped_column(Float, nullable=False)
    resolved_ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    dns_server: Mapped[str | None] = mapped_column(String(45), nullable=True)
    success: Mapped[bool] = mapped_column(Boolean, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)

    test_session = relationship("TestSession", back_populates="dns_results")
