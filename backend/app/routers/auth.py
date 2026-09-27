from fastapi import APIRouter, Depends, status, Request
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.dependencies import get_current_user, get_client_ip
from backend.app.models.user import User
from backend.app.schemas.user import UserCreate, UserLogin, UserResponse, TokenResponse
from backend.app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(
    user_in: UserCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Registers a new user account and immediately returns a valid JWT access token.
    Default role is AUTHOR so users can author technical articles.
    """
    client_ip = get_client_ip(request)
    user = AuthService.register_user(db, user_in, client_ip)
    # Generate token immediately
    from backend.app.core.security import create_access_token
    token = create_access_token(subject=str(user.id))
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
def login(
    login_data: UserLogin,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Authenticates a user with username/email and password, returning a JWT token.
    """
    client_ip = get_client_ip(request)
    user, token = AuthService.authenticate_user(db, login_data, client_ip)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """
    Fetches the profile details and role of the currently authenticated user.
    """
    return UserResponse.model_validate(current_user)
