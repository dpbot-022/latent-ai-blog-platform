import smtplib
import secrets
import logging
from email.message import EmailMessage
from datetime import datetime, timezone
from typing import Optional
from backend.app.core.config import settings

logger = logging.getLogger("latent.email_service")

class EmailService:
    @staticmethod
    def generate_otp() -> str:
        """Generates a cryptographically secure 6-digit one-time password."""
        return f"{secrets.randbelow(900000) + 100000}"

    @staticmethod
    def mask_email(email: str) -> str:
        """Masks an email for secure client display (e.g., el***@latent.ai)."""
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
        If SMTP credentials (e.g. Gmail) are provided in settings, transmits via live SMTP.
        Otherwise, logs securely to server console without leaking to frontend.
        """
        masked = cls.mask_email(to_email)
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

        # 1. Attempt real SMTP dispatch if configured
        if settings.SMTP_USER and settings.SMTP_PASSWORD:
            try:
                msg = EmailMessage()
                msg["Subject"] = f"Your Verification Code: {otp} — LATENT"
                from_addr = settings.SMTP_FROM_EMAIL or f"LATENT AI Journal <{settings.SMTP_USER}>"
                msg["From"] = from_addr
                msg["To"] = to_email

                # Plain-text alternative
                msg.set_content(
                    f"Hello {username},\n\n"
                    f"Welcome to LATENT! Use the verification code below to complete your registration:\n\n"
                    f"    {otp}\n\n"
                    f"This code will expire in 10 minutes.\n"
                    f"If you did not initiate this request, you can safely ignore this email.\n\n"
                    f"— LATENT Systems Team\n"
                )

                # Rich HTML version
                msg.add_alternative(f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f17; color: #e2e8f0; margin: 0; padding: 24px; }}
    .card {{ max-width: 520px; margin: 0 auto; background: #131b2e; border: 1px solid #1e293b; border-radius: 12px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }}
    .logo {{ font-size: 20px; font-weight: 800; letter-spacing: 0.05em; color: #60a5fa; margin-bottom: 24px; }}
    .title {{ font-size: 22px; font-weight: 700; color: #ffffff; margin-bottom: 12px; }}
    .desc {{ font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 24px; }}
    .otp-box {{ background: #0f172a; border: 2px dashed #3b82f6; border-radius: 8px; text-align: center; padding: 18px; margin-bottom: 24px; }}
    .otp-code {{ font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; font-family: monospace; }}
    .footer {{ font-size: 12px; color: #64748b; line-height: 1.5; border-top: 1px solid #1e293b; padding-top: 16px; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">λ LATENT <span style="font-size: 13px; color: #64748b; font-weight: 400;">• AI & Systems</span></div>
    <div class="title">Security Verification Code</div>
    <p class="desc">Hello <strong>{username}</strong>,<br>Welcome to LATENT. To complete your account verification and sign-in, enter the 6-digit code below:</p>
    <div class="otp-box">
      <div class="otp-code">{otp}</div>
    </div>
    <p class="desc" style="font-size: 13px;">⏱️ This code is valid for <strong>10 minutes</strong>. For security, never share this code with anyone.</p>
    <div class="footer">
      Sent to {to_email}. If you didn't create an account on LATENT, please ignore this email.
    </div>
  </div>
</body>
</html>""", subtype="html")

                if settings.SMTP_PORT == 465 and not settings.SMTP_USE_TLS:
                    with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=12) as server:
                        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                        server.send_message(msg)
                else:
                    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=12) as server:
                        if settings.SMTP_USE_TLS:
                            server.ehlo()
                            server.starttls()
                            server.ehlo()
                        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                        server.send_message(msg)

                logger.info(f"OTP successfully transmitted via live SMTP to {masked}")
                print(f"✅ [SMTP SUCCESS] OTP email delivered to {to_email} via {settings.SMTP_HOST}")
                return True
            except Exception as e:
                logger.error(f"Failed to dispatch email via SMTP ({settings.SMTP_HOST}): {e}")
                print(f"⚠️ [SMTP ERROR] Could not send email via {settings.SMTP_HOST}: {e}")

        # 2. Server-side log for development/testing when SMTP credentials not provided
        print("\n" + "=" * 70)
        print("📨 [LATENT EMAIL GATEWAY] Verification Code Dispatched")
        print("=" * 70)
        print(f"To:        {to_email} ({username})")
        print(f"Timestamp: {timestamp}")
        print(f"Subject:   Your First-Time Login Verification Code: {otp} — LATENT")
        print("-" * 70)
        print(f"Hello {username},")
        print(f"")
        print(f"Your one-time verification code is:")
        print(f"")
        print(f"    ┌───────────────────────────┐")
        print(f"    │        {otp}             │")
        print(f"    └───────────────────────────┘")
        print(f"")
        print(f"Note: To configure live Gmail delivery, set SMTP_USER and SMTP_PASSWORD in .env.")
        print(f"This code will expire in 10 minutes.")
        print("=" * 70 + "\n")

        logger.info(f"OTP logged to server console for {masked}")
        return True
