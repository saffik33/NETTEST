from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.ws_manager import ws_manager
from app.database import AsyncSessionLocal, get_db
from app.models.test_session import TestSession
from app.schemas.test_session import TestRunRequest, TestRunResponse, TestSessionOut
from app.services.test_orchestrator import run_full_test, test_lock

router = APIRouter(prefix="/tests", tags=["tests"])


async def _run_test_session(session_id: int, request: TestRunRequest):
    async with AsyncSessionLocal() as db:
        try:
            await run_full_test(
                session_id=session_id,
                db=db,
                ws_manager=ws_manager,
                trigger_type="manual",
                include_speed=request.include_speed,
                include_ping=request.include_ping,
                include_dns=request.include_dns,
                include_wifi=request.include_wifi,
                include_traceroute=request.include_traceroute,
                include_device_scan=request.include_device_scan,
            )
        finally:
            test_lock.release()


@router.post("/run", response_model=TestRunResponse)
async def run_test(request: TestRunRequest, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    if test_lock.locked():
        raise HTTPException(status_code=409, detail="A test is already running")

    await test_lock.acquire()

    try:
        session = TestSession(
            started_at=datetime.now(timezone.utc),
            trigger_type="manual",
            status="running",
        )
        db.add(session)
        await db.commit()
        await db.refresh(session)

        background_tasks.add_task(_run_test_session, session.id, request)
    except Exception:
        test_lock.release()
        raise

    return TestRunResponse(session_id=session.id, status="running")


@router.get("/sessions", response_model=list[TestSessionOut])
async def list_sessions(limit: int = 50, offset: int = 0, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(TestSession).order_by(TestSession.started_at.desc()).offset(offset).limit(limit)
    )
    return result.scalars().all()


@router.get("/sessions/{session_id}", response_model=TestSessionOut)
async def get_session(session_id: int, db: AsyncSession = Depends(get_db)):
    session = await db.get(TestSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.delete("/sessions/{session_id}", status_code=204)
async def delete_session(session_id: int, db: AsyncSession = Depends(get_db)):
    session = await db.get(TestSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    await db.delete(session)
    await db.commit()
