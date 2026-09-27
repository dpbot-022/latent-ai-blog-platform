from typing import List
from fastapi import APIRouter, Depends, status, Request
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.dependencies import get_current_user, get_client_ip
from backend.app.models.user import User
from backend.app.schemas.comment import CommentCreate, CommentResponse
from backend.app.repositories.comment_repo import CommentRepository
from backend.app.services.comment_service import CommentService

router = APIRouter(tags=["Discussions & Comments"])

@router.get("/posts/{post_id}/comments", response_model=List[CommentResponse])
def get_comments(
    post_id: int,
    db: Session = Depends(get_db)
):
    """
    Public Endpoint: Fetch all discussion comments for an article, ordered chronologically.
    """
    comments = CommentRepository.get_by_post_id(db, post_id)
    return [CommentResponse.model_validate(c) for c in comments]

@router.post("/posts/{post_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def add_comment(
    post_id: int,
    comment_in: CommentCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Authenticated Endpoint: Add a new comment to an article.
    Available to all logged-in roles (READER, AUTHOR, ADMIN).
    """
    client_ip = get_client_ip(request)
    created = CommentService.create_comment(db, post_id, comment_in, current_user, client_ip)
    # Refresh to include author eager load
    refreshed = CommentRepository.get_by_id(db, created.id)
    return CommentResponse.model_validate(refreshed)

@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Authenticated Endpoint: Delete a comment.
    Allowed for the comment author, the post owner, or an ADMIN.
    """
    client_ip = get_client_ip(request)
    CommentService.delete_comment(db, comment_id, current_user, client_ip)
    return None
