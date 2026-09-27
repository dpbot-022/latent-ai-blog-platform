from pydantic import BaseModel

class LikeToggleResponse(BaseModel):
    liked: bool
    likes_count: int
    message: str

class LikeStatusResponse(BaseModel):
    has_liked: bool
    likes_count: int
