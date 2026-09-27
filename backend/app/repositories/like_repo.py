from typing import Optional
from sqlalchemy.orm import Session
from backend.app.models.like import Like

class LikeRepository:
    @staticmethod
    def get(db: Session, post_id: int, user_id: int) -> Optional[Like]:
        return db.query(Like).filter(Like.post_id == post_id, Like.user_id == user_id).first()

    @staticmethod
    def add(db: Session, post_id: int, user_id: int) -> Like:
        like = Like(post_id=post_id, user_id=user_id)
        db.add(like)
        db.commit()
        db.refresh(like)
        return like

    @staticmethod
    def remove(db: Session, like: Like) -> None:
        db.delete(like)
        db.commit()

    @staticmethod
    def count_by_post(db: Session, post_id: int) -> int:
        return db.query(Like).filter(Like.post_id == post_id).count()

    @staticmethod
    def count_all(db: Session) -> int:
        return db.query(Like).count()
