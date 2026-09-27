from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from backend.app.schemas.user import UserAuthorSnippet

class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)

class CommentResponse(BaseModel):
    id: int
    content: str
    post_id: int
    author_id: int
    created_at: datetime
    author: UserAuthorSnippet
    model_config = ConfigDict(from_attributes=True)
