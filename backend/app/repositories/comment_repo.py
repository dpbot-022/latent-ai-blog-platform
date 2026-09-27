from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from backend.app.models.comment import Comment

class CommentRepository:
    @staticmethod
    def create(db: Session, comment: Comment) -> Comment:
        db.add(comment)
        db.commit()
        db.refresh(comment)
        return comment

    @staticmethod
    def get_by_id(db: Session, comment_id: int) -> Optional[Comment]:
        return db.query(Comment).filter(Comment.id == comment_id).first()

    @staticmethod
    def get_by_post_id(db: Session, post_id: int) -> List[Comment]:
        return db.query(Comment).options(
            joinedload(Comment.author)
        ).filter(
            Comment.post_id == post_id
        ).order_by(
            Comment.created_at.desc()
        ).all()

    @staticmethod
    def delete(db: Session, comment: Comment) -> None:
        db.delete(comment)
        db.commit()

    @staticmethod
    def count_all(db: Session) -> int:
        return db.query(Comment).count()
