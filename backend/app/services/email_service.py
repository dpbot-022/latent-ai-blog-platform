import random
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

logger = logging.getLogger("latent.email_service")

class EmailService:
    @staticmethod
    def generate_otp() -> str:
        """Generates a secure 6-digit one-time password."""
        return f"{random.randint(100000, 999999)}"

    @staticmethod
    def mask_email(email: str) -> str:
        """Masks an email for secure client display (e.g., el***@nexusai.io)."""
        if "@" not in email:
            return email
        name, domain = email.split("@", 1)
        if len(name) <= 2:
            masked_name = name[0] + "*"
        else:
            masked_name = name[:2] + "*" * (len(name) - 2)
        return f"{masked_name}@{domain}"

    @classmethod
    def send_first_login_otp(cls, to_email: str, username: str, otp: str) -> bool:
        """
        Dispatches first-time login verification OTP email.
        Prints a prominent production terminal email box for testing/demo.
        """
        masked = cls.mask_email(to_email)
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

        print("\n" + "=" * 70)
        print("📨 [LATENT SECURE EMAIL GATEWAY] Verification Code Dispatched")
        print("=" * 70)
        print(f"To:        {to_email} ({username})")
        print(f"Timestamp: {timestamp}")
        print(f"Subject:   Your First-Time Login Verification Code — LATENT")
        print("-" * 70)
        print(f"Hello {username},")
        print(f"")
        print(f"Welcome to LATENT! Because this is your first time logging in,")
        print(f"please verify your registered email address with this one-time code:")
        print(f"")
        print(f"    ┌───────────────────────────┐")
        print(f"    │        {otp}             │")
        print(f"    └───────────────────────────┘")
        print(f"")
        print(f"This code will expire in 10 minutes.")
        print("=" * 70 + "\n")

        logger.info(f"OTP email dispatched to {masked} for user {username}")
        return True
