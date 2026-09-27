import time
from datetime import datetime, timezone
from typing import Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.core.dependencies import get_current_user, require_role
from backend.app.models.user import User, UserRole
from backend.app.schemas.common import HealthCheckResponse, SystemMetricsResponse, AuditLogResponse, AuditLogItem
from backend.app.repositories.user_repo import UserRepository
from backend.app.repositories.post_repo import PostRepository
from backend.app.repositories.comment_repo import CommentRepository
from backend.app.repositories.like_repo import LikeRepository
from backend.app.repositories.audit_repo import AuditRepository
from backend.app.services.external_ai_service import ExternalAIService

router = APIRouter(tags=["System & Observability"])

START_TIME = time.time()
REQUEST_METRICS = {
    "total_requests": 0,
    "total_time_ms": 0.0
}

class DraftAnalysisRequest(BaseModel):
    title: str
    content: str

@router.get("/health", response_model=HealthCheckResponse, tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    """
    Day 5: Health Checks - Validates application health and database connection.
    Used by Docker/Kubernetes container probes.
    """
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return HealthCheckResponse(
        status="UP" if db_status == "healthy" else "DEGRADED",
        timestamp=datetime.now(timezone.utc),
        version=settings.PROJECT_VERSION,
        database=db_status,
        uptime_seconds=round(time.time() - START_TIME, 2)
    )

@router.get("/metrics", response_model=SystemMetricsResponse, tags=["Observability"])
def get_system_metrics(db: Session = Depends(get_db)):
    """
    Day 5: Metrics & Observability - Aggregates system throughput and database metrics.
    """
    total_users = UserRepository.count(db)
    total_posts = PostRepository.count_all(db)
    total_comments = CommentRepository.count_all(db)
    total_likes = LikeRepository.count_all(db)
    cat_breakdown = PostRepository.count_by_categories(db)

    reqs = max(1, REQUEST_METRICS["total_requests"])
    avg_latency = round(REQUEST_METRICS["total_time_ms"] / reqs, 2)

    return SystemMetricsResponse(
        total_users=total_users,
        total_posts=total_posts,
        total_comments=total_comments,
        total_likes=total_likes,
        total_requests_processed=REQUEST_METRICS["total_requests"],
        average_response_time_ms=avg_latency,
        categories_breakdown=cat_breakdown
    )

@router.get("/api/v1/system/audit-logs", response_model=AuditLogResponse, tags=["Observability"])
def get_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.AUTHOR]))
):
    """
    Day 5: Audit Logs - Tracks administrative events, security triggers, and author operations.
    """
    logs = AuditRepository.get_recent(db, limit=50)
    total = AuditRepository.count(db)
    return AuditLogResponse(
        items=[AuditLogItem.model_validate(log) for log in logs],
        total=total
    )

@router.post("/api/v1/system/analyze-draft", tags=["External AI Integration"])
async def analyze_draft_with_ai(
    req: DraftAnalysisRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Day 2: External API Integration - Analyzes draft content using mockable LLM inference
    with timeouts, exponential backoff retries, and data mapping.
    """
    return await ExternalAIService.analyze_article_content(req.title, req.content)
