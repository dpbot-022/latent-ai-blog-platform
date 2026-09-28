from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from backend.app.models.user import User, UserRole
from backend.app.schemas.user import UserCreate, UserLogin, OTPVerifyRequest, OTPResendRequest
from backend.app.repositories.user_repo import UserRepository
from backend.app.repositories.audit_repo import AuditRepository
from backend.app.core.security import hash_password, verify_password, create_access_token
from backend.app.services.email_service import EmailService

class AuthService:
    @staticmethod
    def register_user(db: Session, user_in: UserCreate, client_ip: Optional[str] = None) -> User:
        existing_user = UserRepository.get_by_username(db, user_in.username)
        if existing_user:
            if not existing_user.is_verified:
                existing_user.hashed_password = hash_password(user_in.password)
                existing_user.email = user_in.email.strip().lower()
                existing_user.full_name = user_in.full_name or existing_user.username
                if user_in.role:
                    existing_user.role = user_in.role
                db.commit()
                db.refresh(existing_user)
                return existing_user
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Username '{user_in.username}' is already registered. Please sign in."
            )

        existing_email = UserRepository.get_by_email(db, user_in.email)
        if existing_email:
            if not existing_email.is_verified:
                existing_email.hashed_password = hash_password(user_in.password)
                existing_email.username = user_in.username.strip()
                existing_email.full_name = user_in.full_name or existing_email.username
                if user_in.role:
                    existing_email.role = user_in.role
                db.commit()
                db.refresh(existing_email)
                return existing_email
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Email '{user_in.email}' is already registered. Please sign in."
            )

        hashed_pw = hash_password(user_in.password)
        user = User(
            username=user_in.username.strip(),
            email=user_in.email.strip().lower(),
            hashed_password=hashed_pw,
            full_name=user_in.full_name or user_in.username,
            bio=user_in.bio or "AI & Data Engineering Enthusiast",
            avatar_url=user_in.avatar_url or f"https://api.dicebear.com/7.x/bottts/svg?seed={user_in.username}",
            role=user_in.role or UserRole.AUTHOR,
            is_verified=False  # Requires first-time login OTP verification
        )
        created_user = UserRepository.create(db, user)

        AuditRepository.log(
            db=db,
            action="USER_REGISTERED",
            user_id=created_user.id,
            username=created_user.username,
            ip_address=client_ip,
            resource_type="user",
            resource_id=str(created_user.id),
            details=f"User registered with role {created_user.role}. OTP verification pending."
        )
        return created_user

    @classmethod
    def authenticate_user(
        cls, db: Session, login_data: UserLogin, client_ip: Optional[str] = None
    ) -> Tuple[User, Optional[str], Optional[str]]:
        """
        Authenticates credentials.
        If user is NOT yet verified (first-time login), triggers OTP dispatch and returns (user, None, otp_code).
        If user is verified, returns (user, token, None).
        """
        user = UserRepository.get_by_username_or_email(db, login_data.username.strip().lower())
        if not user or not verify_password(login_data.password, user.hashed_password):
            AuditRepository.log(
                db=db,
                action="LOGIN_FAILED",
                username=login_data.username,
                ip_address=client_ip,
                resource_type="auth",
                details="Invalid credentials attempt"
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username/email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Check First-Time Login OTP Verification Filter
        if not user.is_verified:
            otp = EmailService.generate_otp()
            user.otp_code = otp
            user.otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
            db.commit()

            EmailService.send_first_login_otp(user.email, user.username, otp)

            AuditRepository.log(
                db=db,
                action="LOGIN_OTP_DISPATCHED",
                user_id=user.id,
                username=user.username,
                ip_address=client_ip,
                resource_type="auth",
                details=f"First-time login OTP dispatched to {EmailService.mask_email(user.email)}"
            )
            return user, None, otp

        # Normal authenticated login for verified user
        token = create_access_token(subject=str(user.id))
        AuditRepository.log(
            db=db,
            action="LOGIN_SUCCESS",
            user_id=user.id,
            username=user.username,
            ip_address=client_ip,
            resource_type="auth",
            details="User logged in successfully"
        )
        return user, token, None

    @classmethod
    def verify_otp(
        cls, db: Session, verify_data: OTPVerifyRequest, client_ip: Optional[str] = None
    ) -> Tuple[User, str]:
        """
        Verifies 6-digit OTP code on first-time login.
        Activates user and returns signed JWT token upon success.
        """
        user = UserRepository.get_by_username_or_email(db, verify_data.username.strip().lower())
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")

        if user.is_verified:
            # Already verified; generate token
            token = create_access_token(subject=str(user.id))
            return user, token

        if not user.otp_code or not user.otp_expires_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No pending verification code found. Please request a new one."
            )

        # Expiration check
        now = datetime.now(timezone.utc)
        expires_at = user.otp_expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if now > expires_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification code has expired. Please request a new code."
            )

        # Code match check
        if user.otp_code.strip() != verify_data.otp_code.strip():
            AuditRepository.log(
                db=db,
                action="OTP_VERIFICATION_FAILED",
                user_id=user.id,
                username=user.username,
                ip_address=client_ip,
                resource_type="auth",
                details="Invalid OTP code entered"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification code. Please check your email and try again."
            )

        # Mark user verified & clear OTP
        user.is_verified = True
        user.otp_code = None
        user.otp_expires_at = None
        db.commit()
        db.refresh(user)

        token = create_access_token(subject=str(user.id))
        AuditRepository.log(
            db=db,
            action="FIRST_LOGIN_OTP_VERIFIED",
            user_id=user.id,
            username=user.username,
            ip_address=client_ip,
            resource_type="auth",
            details="First-time login OTP verified successfully. Account fully activated."
        )
        return user, token

    @classmethod
    def resend_otp(cls, db: Session, resend_data: OTPResendRequest, client_ip: Optional[str] = None) -> str:
        """Regenerates and resends a new OTP code."""
        user = UserRepository.get_by_username_or_email(db, resend_data.username.strip().lower())
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")

        if user.is_verified:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account is already verified.")

        otp = EmailService.generate_otp()
        user.otp_code = otp
        user.otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
        db.commit()

        EmailService.send_first_login_otp(user.email, user.username, otp)

        AuditRepository.log(
            db=db,
            action="OTP_RESENT",
            user_id=user.id,
            username=user.username,
            ip_address=client_ip,
            resource_type="auth",
            details="New OTP code generated and dispatched"
        )
        return otp
