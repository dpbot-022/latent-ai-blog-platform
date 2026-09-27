from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, ConfigDict

class HealthCheckResponse(BaseModel):
    status: str
    timestamp: datetime
    version: str
    database: str
    uptime_seconds: float

class SystemMetricsResponse(BaseModel):
    total_users: int
    total_posts: int
    total_comments: int
    total_likes: int
    total_requests_processed: int
    average_response_time_ms: float
    categories_breakdown: Dict[str, int]

class AuditLogItem(BaseModel):
    id: int
    action: str
    user_id: Optional[int] = None
    username: Optional[str] = None
    ip_address: Optional[str] = None
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    details: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class AuditLogResponse(BaseModel):
    items: List[AuditLogItem]
    total: int
