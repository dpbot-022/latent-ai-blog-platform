from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from backend.app.models.user import User, UserRole

class UserRepository:
    @staticmethod
    def get_by_id(db: Session, user_id: int) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_by_username(db: Session, username: str) -> Optional[User]:
        clean = username.strip().lower()
        return db.query(User).filter(func.lower(User.username) == clean).first()

    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[User]:
        clean = email.strip().lower()
        return db.query(User).filter(func.lower(User.email) == clean).first()

    @staticmethod
    def get_by_username_or_email(db: Session, identifier: str) -> Optional[User]:
        clean = identifier.strip().lower()
        return db.query(User).filter(
            or_(func.lower(User.username) == clean, func.lower(User.email) == clean)
        ).first()

    @staticmethod
    def create(db: Session, user: User) -> User:
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def count(db: Session) -> int:
        return db.query(User).count()
