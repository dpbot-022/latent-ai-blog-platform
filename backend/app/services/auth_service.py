from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from backend.app.models.user import User, UserRole
from backend.app.schemas.user import UserCreate, UserLogin
from backend.app.repositories.user_repo import UserRepository
from backend.app.repositories.audit_repo import AuditRepository
from backend.app.core.security import hash_password, verify_password, create_access_token

class AuthService:
    @staticmethod
    def register_user(db: Session, user_in: UserCreate, client_ip: Optional[str] = None) -> User:
        # Check existing username
        if UserRepository.get_by_username(db, user_in.username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Username '{user_in.username}' is already taken."
            )

        # Check existing email
        if UserRepository.get_by_email(db, user_in.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Email '{user_in.email}' is already registered."
            )

        # Hash password and create user
        hashed_pw = hash_password(user_in.password)
        user = User(
            username=user_in.username.strip(),
            email=user_in.email.strip().lower(),
            hashed_password=hashed_pw,
            full_name=user_in.full_name or user_in.username,
            bio=user_in.bio or "AI & Data Engineering Enthusiast",
            avatar_url=user_in.avatar_url or f"https://api.dicebear.com/7.x/bottts/svg?seed={user_in.username}",
            role=user_in.role or UserRole.AUTHOR
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
            details=f"User registered with role {created_user.role}"
        )
        return created_user

    @staticmethod
    def authenticate_user(db: Session, login_data: UserLogin, client_ip: Optional[str] = None) -> tuple[User, str]:
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
        return user, token
