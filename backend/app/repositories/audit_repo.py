from typing import List, Optional
from sqlalchemy.orm import Session
from backend.app.models.audit_log import AuditLog

class AuditRepository:
    @staticmethod
    def log(
        db: Session,
        action: str,
        user_id: Optional[int] = None,
        username: Optional[str] = None,
        ip_address: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        details: Optional[str] = None
    ) -> AuditLog:
        entry = AuditLog(
            action=action,
            user_id=user_id,
            username=username,
            ip_address=ip_address,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id is not None else None,
            details=details
        )
        db.add(entry)
        try:
            db.commit()
            db.refresh(entry)
        except Exception:
            db.rollback()
        return entry

    @staticmethod
    def get_recent(db: Session, limit: int = 50) -> List[AuditLog]:
        return db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()

    @staticmethod
    def count(db: Session) -> int:
        return db.query(AuditLog).count()
