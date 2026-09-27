from typing import Union
from fastapi import APIRouter, Depends, status, Request
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.dependencies import get_current_user, get_client_ip
from backend.app.models.user import User
from backend.app.schemas.user import (
    UserCreate, UserLogin, UserResponse, TokenResponse,
    OTPRequiredResponse, OTPVerifyRequest, OTPResendRequest
)
from backend.app.services.auth_service import AuthService
from backend.app.services.email_service import EmailService

router = APIRouter(prefix="/auth", tags=["Authentication & OTP Security"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(
    user_in: UserCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Registers a new user account.
    The account requires email OTP verification upon first-time login.
    """
    client_ip = get_client_ip(request)
    user = AuthService.register_user(db, user_in, client_ip)
    return UserResponse.model_validate(user)

@router.post("/login", response_model=Union[TokenResponse, OTPRequiredResponse], status_code=status.HTTP_200_OK)
def login(
    login_data: UserLogin,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Authenticates user credentials.
    If first-time login (not yet email-verified), dispatches a 6-digit OTP code to their
    registered email and prompts client for verification.
    If already verified, returns standard JWT token.
    """
    client_ip = get_client_ip(request)
    user, token, otp = AuthService.authenticate_user(db, login_data, client_ip)

    if otp is not None:
        # First-time login: OTP dispatched
        return OTPRequiredResponse(
            requires_otp=True,
            username=user.username,
            email_masked=EmailService.mask_email(user.email),
            message="First-time login detected. A 6-digit verification code has been dispatched to your email.",
            demo_otp_hint=otp
        )

    # Already verified: direct token issuance
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.post("/verify-otp", response_model=TokenResponse, status_code=status.HTTP_200_OK)
def verify_otp(
    verify_data: OTPVerifyRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Verifies the 6-digit code received on first-time login.
    Upon successful validation, marks user as verified and issues signed JWT bearer token.
    """
    client_ip = get_client_ip(request)
    user, token = AuthService.verify_otp(db, verify_data, client_ip)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.post("/resend-otp", status_code=status.HTTP_200_OK)
def resend_otp(
    resend_data: OTPResendRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Resends a fresh 6-digit OTP code to the user's registered email address.
    """
    client_ip = get_client_ip(request)
    otp = AuthService.resend_otp(db, resend_data, client_ip)
    return {
        "status": "success",
        "message": "A fresh 6-digit verification code has been sent to your email.",
        "demo_otp_hint": otp
    }

@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """
    Fetches the profile details and role of the currently authenticated user.
    """
    return UserResponse.model_validate(current_user)
