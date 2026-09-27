from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.dependencies import get_current_user, get_optional_user
from backend.app.models.user import User
from backend.app.schemas.like import LikeToggleResponse, LikeStatusResponse
from backend.app.repositories.like_repo import LikeRepository
from backend.app.services.post_service import PostService

router = APIRouter(prefix="/posts/{post_id}/likes", tags=["Likes & Engagement"])

@router.post("/toggle", response_model=LikeToggleResponse, status_code=status.HTTP_200_OK)
def toggle_like(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Authenticated Endpoint: Toggle like state on an article.
    If not liked, adds like. If already liked, removes like.
    """
    liked, likes_count = PostService.toggle_like(db, post_id, current_user)
    return LikeToggleResponse(
        liked=liked,
        likes_count=likes_count,
        message="Article liked successfully." if liked else "Article unliked."
    )

@router.get("/status", response_model=LikeStatusResponse, status_code=status.HTTP_200_OK)
def get_like_status(
    post_id: int,
    optional_user: User = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Public/Semi-Authenticated Endpoint: Returns total likes and whether current user has liked.
    """
    has_liked = False
    if optional_user:
        has_liked = LikeRepository.get(db, post_id, optional_user.id) is not None

    total_likes = LikeRepository.count_by_post(db, post_id)
    return LikeStatusResponse(
        has_liked=has_liked,
        likes_count=total_likes
    )
