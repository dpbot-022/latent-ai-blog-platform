import re
import uuid
import math
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from backend.app.models.post import Post
from backend.app.models.user import User, UserRole
from backend.app.models.like import Like
from backend.app.schemas.post import PostCreate, PostUpdate, PostSummaryResponse, PostDetailResponse
from backend.app.schemas.user import UserAuthorSnippet
from backend.app.repositories.post_repo import PostRepository
from backend.app.repositories.like_repo import LikeRepository
from backend.app.repositories.audit_repo import AuditRepository

class PostService:
    @staticmethod
    def slugify(title: str) -> str:
        s = title.lower().strip()
        s = re.sub(r"[^\w\s-]", "", s)
        s = re.sub(r"[\s_-]+", "-", s)
        return s[:80].strip("-")

    @staticmethod
    def calculate_read_time(content: str) -> int:
        words = len(content.split())
        return max(1, math.ceil(words / 200))

    @classmethod
    def create_post(cls, db: Session, post_in: PostCreate, current_user: User, client_ip: Optional[str] = None) -> Post:
        if current_user.role == UserRole.READER:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Readers are not authorized to publish articles. Upgrade to Author."
            )

        base_slug = cls.slugify(post_in.title)
        slug = base_slug
        # Handle collision
        if PostRepository.get_by_slug(db, slug):
            slug = f"{base_slug}-{uuid.uuid4().hex[:6]}"

        read_time = post_in.read_time_minutes or cls.calculate_read_time(post_in.content)

        post = Post(
            title=post_in.title.strip(),
            slug=slug,
            excerpt=post_in.excerpt.strip(),
            content=post_in.content.strip(),
            cover_image=post_in.cover_image or "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
            category=post_in.category.strip(),
            tags=post_in.tags or "AI,DataEngineering",
            read_time_minutes=read_time,
            is_published=post_in.is_published if post_in.is_published is not None else True,
            author_id=current_user.id
        )

        created_post = PostRepository.create(db, post)

        AuditRepository.log(
            db=db,
            action="POST_CREATED",
            user_id=current_user.id,
            username=current_user.username,
            ip_address=client_ip,
            resource_type="post",
            resource_id=str(created_post.id),
            details=f"Created post '{created_post.title}'"
        )
        return created_post

    @classmethod
    def update_post(cls, db: Session, post_id: int, post_in: PostUpdate, current_user: User, client_ip: Optional[str] = None) -> Post:
        post = PostRepository.get_by_id(db, post_id)
        if not post:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found.")

        # Ownership Rule & RBAC (Day 3 & Day 5)
        if post.author_id != current_user.id and current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You do not own this resource."
            )

        update_data = post_in.model_dump(exclude_unset=True)
        if "title" in update_data and update_data["title"] != post.title:
            base_slug = cls.slugify(update_data["title"])
            post.slug = f"{base_slug}-{uuid.uuid4().hex[:6]}"

        if "content" in update_data:
            post.read_time_minutes = cls.calculate_read_time(update_data["content"])

        for field, value in update_data.items():
            setattr(post, field, value)

        updated_post = PostRepository.update(db, post)

        AuditRepository.log(
            db=db,
            action="POST_UPDATED",
            user_id=current_user.id,
            username=current_user.username,
            ip_address=client_ip,
            resource_type="post",
            resource_id=str(updated_post.id),
            details=f"Updated post ID {updated_post.id}"
        )
        return updated_post

    @classmethod
    def delete_post(cls, db: Session, post_id: int, current_user: User, client_ip: Optional[str] = None) -> None:
        post = PostRepository.get_by_id(db, post_id)
        if not post:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found.")

        # Ownership Rule & RBAC (Day 3 & Day 5)
        if post.author_id != current_user.id and current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You do not own this resource."
            )

        AuditRepository.log(
            db=db,
            action="POST_DELETED",
            user_id=current_user.id,
            username=current_user.username,
            ip_address=client_ip,
            resource_type="post",
            resource_id=str(post.id),
            details=f"Deleted post '{post.title}'"
        )
        PostRepository.delete(db, post)

    @staticmethod
    def to_summary_response(post: Post) -> PostSummaryResponse:
        return PostSummaryResponse(
            id=post.id,
            title=post.title,
            slug=post.slug,
            excerpt=post.excerpt,
            cover_image=post.cover_image,
            category=post.category,
            tags=post.tags,
            read_time_minutes=post.read_time_minutes,
            is_published=post.is_published,
            views_count=post.views_count,
            created_at=post.created_at,
            likes_count=len(post.likes) if post.likes is not None else 0,
            comments_count=len(post.comments) if post.comments is not None else 0,
            author=UserAuthorSnippet.model_validate(post.author)
        )

    @staticmethod
    def to_detail_response(post: Post) -> PostDetailResponse:
        from backend.app.schemas.comment import CommentResponse
        return PostDetailResponse(
            id=post.id,
            title=post.title,
            slug=post.slug,
            excerpt=post.excerpt,
            content=post.content,
            cover_image=post.cover_image,
            category=post.category,
            tags=post.tags,
            read_time_minutes=post.read_time_minutes,
            is_published=post.is_published,
            views_count=post.views_count,
            created_at=post.created_at,
            likes_count=len(post.likes) if post.likes is not None else 0,
            comments_count=len(post.comments) if post.comments is not None else 0,
            author=UserAuthorSnippet.model_validate(post.author),
            comments=[CommentResponse.model_validate(c) for c in post.comments]
        )

    @classmethod
    def toggle_like(cls, db: Session, post_id: int, current_user: User) -> tuple[bool, int]:
        post = PostRepository.get_by_id(db, post_id)
        if not post:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found.")

        existing_like = LikeRepository.get(db, post_id, current_user.id)
        if existing_like:
            LikeRepository.remove(db, existing_like)
            liked = False
        else:
            LikeRepository.add(db, post_id, current_user.id)
            liked = True

        total_likes = LikeRepository.count_by_post(db, post_id)
        return liked, total_likes
