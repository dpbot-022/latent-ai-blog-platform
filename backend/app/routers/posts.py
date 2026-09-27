import os
import uuid
import aiofiles
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, UploadFile, File
from sqlalchemy.orm import Session
from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.core.dependencies import get_current_user, get_optional_user, get_client_ip, require_role
from backend.app.models.user import User, UserRole
from backend.app.schemas.post import (
    PostCreate, PostUpdate, PostSummaryResponse, PostDetailResponse, PostPaginationResponse
)
from backend.app.repositories.post_repo import PostRepository
from backend.app.services.post_service import PostService

router = APIRouter(prefix="/posts", tags=["Articles & Posts"])

@router.get("", response_model=PostPaginationResponse)
def list_posts(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(12, ge=1, le=50, description="Items per page"),
    category: Optional[str] = Query(None, description="Filter by category"),
    tag: Optional[str] = Query(None, description="Filter by tag"),
    search: Optional[str] = Query(None, description="Keyword search in title, excerpt, content"),
    author_id: Optional[int] = Query(None, description="Filter by author ID"),
    sort_by: str = Query("created_at", pattern="^(created_at|likes|read_time|views)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db)
):
    """
    Public Endpoint: Browse published technical blogs with pagination, filtering, search, and sorting.
    No login required.
    """
    skip = (page - 1) * limit
    posts, total = PostRepository.list_posts(
        db=db,
        skip=skip,
        limit=limit,
        category=category,
        tag=tag,
        search=search,
        author_id=author_id,
        is_published=True,
        sort_by=sort_by,
        sort_order=sort_order
    )

    items = [PostService.to_summary_response(p) for p in posts]
    total_pages = (total + limit - 1) // limit if total > 0 else 1

    return PostPaginationResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=total_pages
    )

@router.get("/user/my-posts", response_model=List[PostSummaryResponse])
def get_my_posts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Authenticated Endpoint: Returns all articles owned by the currently logged-in user.
    """
    posts, _ = PostRepository.list_posts(
        db=db,
        skip=0,
        limit=100,
        author_id=current_user.id,
        is_published=None  # include drafts and published
    )
    return [PostService.to_summary_response(p) for p in posts]

@router.get("/{id_or_slug}", response_model=PostDetailResponse)
def get_post(
    id_or_slug: str,
    db: Session = Depends(get_db)
):
    """
    Public Endpoint: Read full article by ID or unique slug.
    Automatically increments views counter.
    """
    post = None
    if id_or_slug.isdigit():
        post = PostRepository.get_by_id(db, int(id_or_slug))
    if not post:
        post = PostRepository.get_by_slug(db, id_or_slug)

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Article '{id_or_slug}' not found."
        )

    # Increment view count
    PostRepository.increment_views(db, post.id)
    return PostService.to_detail_response(post)

@router.post("", response_model=PostDetailResponse, status_code=status.HTTP_201_CREATED)
def create_post(
    post_in: PostCreate,
    request: Request,
    current_user: User = Depends(require_role([UserRole.AUTHOR, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Authenticated Endpoint: Create and publish a new technical article.
    Requires AUTHOR or ADMIN role.
    """
    client_ip = get_client_ip(request)
    new_post = PostService.create_post(db, post_in, current_user, client_ip)
    # Reload with relationships
    created = PostRepository.get_by_id(db, new_post.id)
    return PostService.to_detail_response(created)

@router.put("/{post_id}", response_model=PostDetailResponse)
def update_post(
    post_id: int,
    post_in: PostUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Authenticated Endpoint: Update an existing article.
    Only the article owner or an ADMIN can modify.
    """
    client_ip = get_client_ip(request)
    updated = PostService.update_post(db, post_id, post_in, current_user, client_ip)
    refreshed = PostRepository.get_by_id(db, updated.id)
    return PostService.to_detail_response(refreshed)

@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    post_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Authenticated Endpoint: Delete an article.
    Only the article owner or an ADMIN can delete.
    """
    client_ip = get_client_ip(request)
    PostService.delete_post(db, post_id, current_user, client_ip)
    return None

@router.post("/upload-cover", status_code=status.HTTP_200_OK)
async def upload_cover_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Day 4: File Upload & Handling (multipart/form-data)
    Validates file size (max 5MB), checks extension whitelist,
    generates secure unique filename, and saves to static uploads directory.
    """
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed formats: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    # Check file size by reading in chunks/buffer
    contents = await file.read()
    if len(contents) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )

    filename = f"{uuid.uuid4().hex}.{ext}"
    destination_path = settings.UPLOAD_DIR / filename

    async with aiofiles.open(destination_path, "wb") as out_file:
        await out_file.write(contents)

    relative_url = f"/uploads/{filename}"
    return {
        "status": "success",
        "filename": filename,
        "url": relative_url,
        "size_bytes": len(contents)
    }
