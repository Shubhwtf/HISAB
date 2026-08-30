from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select, desc
from sqlalchemy.orm import Session

from apps.api.dependencies import get_db, get_current_user
from packages.domain.auth_rbac import UserSession
from packages.domain.db_models import JobDB

router = APIRouter(prefix="/api/jobs", tags=["Jobs & Background Workers"])


class JobResponse(BaseModel):
    id: str
    org_id: str
    type: str
    status: str
    progress_pct: int
    stage: Optional[str] = None
    payload: Dict[str, Any] = {}
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    attempts: int
    max_attempts: int
    created_at: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class JobListResponse(BaseModel):
    items: List[JobResponse]
    total: int
    limit: int
    offset: int


@router.get("", response_model=JobListResponse)
def list_jobs(
    status: Optional[str] = None,
    type: Optional[str] = None,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: UserSession = Depends(get_current_user),
):
    query = select(JobDB).where(JobDB.org_id == current_user.org_id)
    if status:
        query = query.where(JobDB.status == status)
    if type:
        query = query.where(JobDB.type == type)

    query = query.order_by(desc(JobDB.created_at)).offset(offset).limit(limit)
    jobs = db.scalars(query).all()

    items = []
    for j in jobs:
        items.append(
            JobResponse(
                id=j.id,
                org_id=j.org_id,
                type=j.type,
                status=j.status,
                progress_pct=j.progress_pct,
                stage=j.stage,
                payload=j.payload or {},
                result=j.result,
                error=j.error,
                attempts=j.attempts,
                max_attempts=j.max_attempts,
                created_at=j.created_at.isoformat() if j.created_at else "",
                started_at=j.started_at.isoformat() if j.started_at else None,
                completed_at=j.completed_at.isoformat() if j.completed_at else None,
            )
        )

    return JobListResponse(
        items=items,
        total=len(items),
        limit=limit,
        offset=offset,
    )


@router.get("/{job_id}", response_model=JobResponse)
def get_job_status(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: UserSession = Depends(get_current_user),
):
    job = db.get(JobDB, job_id)
    if not job or job.org_id != current_user.org_id:
        raise HTTPException(status_code=404, detail="Job not found")

    return JobResponse(
        id=job.id,
        org_id=job.org_id,
        type=job.type,
        status=job.status,
        progress_pct=job.progress_pct,
        stage=job.stage,
        payload=job.payload or {},
        result=job.result,
        error=job.error,
        attempts=job.attempts,
        max_attempts=job.max_attempts,
        created_at=job.created_at.isoformat() if job.created_at else "",
        started_at=job.started_at.isoformat() if job.started_at else None,
        completed_at=job.completed_at.isoformat() if job.completed_at else None,
    )


@router.post("/{job_id}/cancel", response_model=JobResponse)
def cancel_job(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: UserSession = Depends(get_current_user),
):
    job = db.get(JobDB, job_id)
    if not job or job.org_id != current_user.org_id:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.status in ("COMPLETED", "FAILED"):
        raise HTTPException(status_code=400, detail=f"Cannot cancel a job that is already {job.status}")

    job.status = "CANCELLED"
    db.commit()

    return JobResponse(
        id=job.id,
        org_id=job.org_id,
        type=job.type,
        status=job.status,
        progress_pct=job.progress_pct,
        stage=job.stage,
        payload=job.payload or {},
        result=job.result,
        error=job.error,
        attempts=job.attempts,
        max_attempts=job.max_attempts,
        created_at=job.created_at.isoformat() if job.created_at else "",
        started_at=job.started_at.isoformat() if job.started_at else None,
        completed_at=job.completed_at.isoformat() if job.completed_at else None,
    )
