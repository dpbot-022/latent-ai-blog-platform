from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from backend.app.schemas.user import UserAuthorSnippet
from backend.app.schemas.comment import CommentResponse

class PostBase(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    excerpt: str = Field(..., min_length=10, max_length=500)
    content: str = Field(..., min_length=20)
    cover_image: Optional[str] = None
    category: str = Field(..., min_length=2, max_length=50)
    tags: Optional[str] = "AI,DataEngineering"
    read_time_minutes: Optional[int] = 5
    is_published: Optional[bool] = True

class PostCreate(PostBase):
    slug: Optional[str] = None

class PostUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=5, max_length=200)
    excerpt: Optional[str] = Field(None, min_length=10, max_length=500)
    content: Optional[str] = Field(None, min_length=20)
    cover_image: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[str] = None
    read_time_minutes: Optional[int] = None
    is_published: Optional[bool] = None

class PostSummaryResponse(BaseModel):
    id: int
    title: str
    slug: str
    excerpt: str
    cover_image: Optional[str] = None
    category: str
    tags: Optional[str] = None
    read_time_minutes: int
    is_published: bool
    views_count: int
    created_at: datetime
    likes_count: int = 0
    comments_count: int = 0
    author: UserAuthorSnippet
    model_config = ConfigDict(from_attributes=True)

class PostDetailResponse(PostSummaryResponse):
    content: str
    comments: List[CommentResponse] = []
    model_config = ConfigDict(from_attributes=True)

class PostPaginationResponse(BaseModel):
    items: List[PostSummaryResponse]
    total: int
    page: int
    limit: int
    pages: int
