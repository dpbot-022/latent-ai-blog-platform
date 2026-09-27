from datetime import datetime
from typing import Optional, Union, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from backend.app.models.user import UserRole

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100)
    role: Optional[UserRole] = UserRole.AUTHOR

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: int
    role: UserRole
    is_verified: bool = False
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class UserAuthorSnippet(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    role: UserRole
    model_config = ConfigDict(from_attributes=True)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class OTPRequiredResponse(BaseModel):
    requires_otp: bool = True
    username: str
    email_masked: str
    message: str
    demo_otp_hint: Optional[str] = None

class OTPVerifyRequest(BaseModel):
    username: str
    otp_code: str = Field(..., min_length=6, max_length=6)

class OTPResendRequest(BaseModel):
    username: str

class TokenData(BaseModel):
    user_id: Optional[int] = None
    username: Optional[str] = None
