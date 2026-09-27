from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from backend.app.models.comment import Comment
from backend.app.models.user import User, UserRole
from backend.app.schemas.comment import CommentCreate, CommentResponse
from backend.app.repositories.post_repo import PostRepository
from backend.app.repositories.comment_repo import CommentRepository
from backend.app.repositories.audit_repo import AuditRepository

class CommentService:
    @staticmethod
    def create_comment(
        db: Session,
        post_id: int,
        comment_in: CommentCreate,
        current_user: User,
        client_ip: Optional[str] = None
    ) -> Comment:
        post = PostRepository.get_by_id(db, post_id)
        if not post:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found.")

        comment = Comment(
            content=comment_in.content.strip(),
            post_id=post_id,
            author_id=current_user.id
        )
        created_comment = CommentRepository.create(db, comment)

        AuditRepository.log(
            db=db,
            action="COMMENT_CREATED",
            user_id=current_user.id,
            username=current_user.username,
            ip_address=client_ip,
            resource_type="comment",
            resource_id=str(created_comment.id),
            details=f"Comment added to post '{post.title}'"
        )
        return created_comment

    @staticmethod
    def delete_comment(
        db: Session,
        comment_id: int,
        current_user: User,
        client_ip: Optional[str] = None
    ) -> None:
        comment = CommentRepository.get_by_id(db, comment_id)
        if not comment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found.")

        # Can be deleted by comment author, post author, or admin
        post = PostRepository.get_by_id(db, comment.post_id)
        is_owner = (comment.author_id == current_user.id)
        is_post_owner = (post and post.author_id == current_user.id)
        is_admin = (current_user.role == UserRole.ADMIN)

        if not (is_owner or is_post_owner or is_admin):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this comment."
            )

        AuditRepository.log(
            db=db,
            action="COMMENT_DELETED",
            user_id=current_user.id,
            username=current_user.username,
            ip_address=client_ip,
            resource_type="comment",
            resource_id=str(comment.id),
            details=f"Comment {comment.id} deleted"
        )
        CommentRepository.delete(db, comment)
