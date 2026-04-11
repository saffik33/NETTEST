from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PingResult(Base):
    __tablename__ = "ping_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    test_session_id: Mapped[int] = mapped_column(Integer, ForeignKey("test_sessions.id"), nullable=False, index=True)
    target_host: Mapped[str] = mapped_column(String(255), nullable=False, default="8.8.8.8")
    avg_latency_ms: Mapped[float] = mapped_column(Float, nullable=False)
    min_latency_ms: Mapped[float] = mapped_column(Float, nullable=False)
    max_latency_ms: Mapped[float] = mapped_column(Float, nullable=False)
    jitter_ms: Mapped[float] = mapped_column(Float, nullable=False)
    packet_loss_pct: Mapped[float] = mapped_column(Float, nullable=False)
    packets_sent: Mapped[int] = mapped_column(Integer, nullable=False)
    packets_received: Mapped[int] = mapped_column(Integer, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)

    test_session = relationship("TestSession", back_populates="ping_results")
