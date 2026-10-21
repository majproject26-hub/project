import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Tuple

from app.config import (
    RESEND_API_KEY,
    RESEND_FROM_EMAIL,
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASSWORD,
    SMTP_FROM_EMAIL,
    SMTP_FROM_NAME,
    SMTP_USE_TLS,
)

def is_resend_configured() -> bool:
    """Check if Resend API key is configured."""
    return bool(RESEND_API_KEY)

def is_smtp_configured() -> bool:
    """Check if SMTP credentials are configured in the environment."""
    return bool(SMTP_USER and SMTP_PASSWORD)

def is_email_configured() -> bool:
    """Check if any real email transport is configured."""
    return is_resend_configured() or is_smtp_configured()

def _send_via_resend(
    to_email: str,
    subject: str,
    html_body: str,
    text_body: str,
) -> Tuple[bool, str]:
    """Sends email using Resend HTTP REST API."""
    try:
        import resend
        resend.api_key = RESEND_API_KEY

        from_email = RESEND_FROM_EMAIL or "onboarding@resend.dev"
        sender_display = f"{SMTP_FROM_NAME} <{from_email}>" if SMTP_FROM_NAME else from_email

        params = {
            "from": sender_display,
            "to": [to_email],
            "subject": subject,
            "html": html_body,
            "text": text_body,
        }
        res = resend.Emails.send(params)
        print(f"[EMAIL_SERVICE] [RESEND_SUCCESS] Dispatched OTP email to {to_email}. Resend ID: {res}")
        return True, f"OTP dispatched to {to_email} via Resend."
    except Exception as e:
        err = f"Resend API error: {e}"
        print(f"[EMAIL_SERVICE] [RESEND_ERROR] {err}")
        return False, err

def _send_via_smtp(
    to_email: str,
    subject: str,
    html_body: str,
    text_body: str,
) -> Tuple[bool, str]:
    """Sends email using standard SMTP."""
    sender_display = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>" if SMTP_FROM_NAME else SMTP_FROM_EMAIL

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = sender_display
    message["To"] = to_email

    part1 = MIMEText(text_body, "plain", "utf-8")
    part2 = MIMEText(html_body, "html", "utf-8")
    message.attach(part1)
    message.attach(part2)

    try:
        if SMTP_PORT == 465:
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context, timeout=15) as server:
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.sendmail(SMTP_FROM_EMAIL or SMTP_USER, [to_email], message.as_string())
        else:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
                if SMTP_USE_TLS:
                    context = ssl.create_default_context()
                    server.starttls(context=context)
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.sendmail(SMTP_FROM_EMAIL or SMTP_USER, [to_email], message.as_string())

        print(f"[EMAIL_SERVICE] [SMTP_SUCCESS] OTP email delivered to {to_email}")
        return True, f"OTP dispatched to {to_email} via SMTP."
    except smtplib.SMTPAuthenticationError as e:
        err = f"SMTP Authentication failed. Please verify SMTP_USER and SMTP_PASSWORD in backend/.env: {e}"
        print(f"[EMAIL_SERVICE] [SMTP_ERROR] {err}")
        return False, err
    except Exception as e:
        err = f"Failed to send email via SMTP to {to_email}: {e}"
        print(f"[EMAIL_SERVICE] [SMTP_ERROR] {err}")
        return False, err

def send_otp_email(
    to_email: str,
    otp_code: str,
    user_name: str = "User",
    company_id: str = ""
) -> Tuple[bool, str]:
    """
    Dispatches a 6-digit OTP verification email to the user.
    Uses Resend API first if configured, then SMTP, then falls back to local simulation.
    Returns (success: bool, status_message: str).
    """
    subject = f"Your QUERIX Security OTP: {otp_code}"
    sender_display = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>" if SMTP_FROM_NAME else SMTP_FROM_EMAIL

    text_body = f"""Hello {user_name},

We received a request to reset your password for QUERIX (Organization: {company_id}).

Your 6-digit verification code is:
{otp_code}

This code is valid for 10 minutes.
If you did not request this password reset, please ignore this email or notify your organization administrator.

Regards,
QUERIX Security Team
"""

    html_body = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your QUERIX Verification Code</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #0b1120; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 0 auto; background-color: #0f172a; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
    <!-- Header -->
    <tr>
      <td style="padding: 28px 32px 20px 32px; border-bottom: 1px solid #1e293b; background: linear-gradient(135deg, rgba(77, 90, 42, 0.25) 0%, rgba(15, 23, 42, 0) 100%);">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td>
              <span style="display: inline-block; padding: 4px 10px; border-radius: 9999px; background-color: rgba(116, 132, 71, 0.25); border: 1px solid rgba(220, 228, 194, 0.3); color: #dce4c2; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;">
                QUERIX Security
              </span>
              <h1 style="margin: 12px 0 0 0; color: #ffffff; font-size: 20px; font-weight: 600; line-height: 1.3;">
                Password Reset Verification
              </h1>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Body Content -->
    <tr>
      <td style="padding: 32px;">
        <p style="margin: 0 0 16px 0; color: #cbd5e1; font-size: 14px; line-height: 1.6;">
          Hello <strong style="color: #ffffff;">{user_name}</strong>,
        </p>
        <p style="margin: 0 0 24px 0; color: #94a3b8; font-size: 14px; line-height: 1.6;">
          We received a request to reset your password for organization <strong style="color: #dce4c2;">{company_id}</strong>. Use the 6-digit one-time password (OTP) below to authenticate your identity:
        </p>

        <!-- OTP Code Card -->
        <div style="background-color: #020617; border: 1px solid #4d5a2a; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
          <div style="color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">
            One-Time Verification Code
          </div>
          <div style="color: #dce4c2; font-size: 36px; font-weight: 800; letter-spacing: 10px; font-family: monospace; line-height: 1.2;">
            {otp_code}
          </div>
          <div style="color: #64748b; font-size: 12px; margin-top: 10px;">
            ⏱️ Expires in <strong>10 minutes</strong>
          </div>
        </div>

        <p style="margin: 0 0 16px 0; color: #94a3b8; font-size: 13px; line-height: 1.5;">
          For security reasons, never share this verification code with anyone, including QUERIX platform administrators.
        </p>
        <p style="margin: 0; color: #64748b; font-size: 12px; line-height: 1.5;">
          If you did not initiate this request, you can safely disregard this email. Your password remains unchanged.
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 20px 32px; background-color: #020617; border-top: 1px solid #1e293b; text-align: center;">
        <p style="margin: 0; color: #475569; font-size: 11px;">
          QUERIX — A Unified Multi-Tenant Lakehouse Analytics Platform • Automated Security Notification
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
"""

    if is_resend_configured():
        return _send_via_resend(to_email, subject, html_body, text_body)
    elif is_smtp_configured():
        return _send_via_smtp(to_email, subject, html_body, text_body)
    else:
        msg = f"[EMAIL_SERVICE] [DEV_SIMULATION] No email provider configured in backend/.env (RESEND_API_KEY or SMTP). Generated OTP for {to_email}: {otp_code}"
        print(msg)
        return False, "Email provider not configured. Please add RESEND_API_KEY or SMTP credentials to backend/.env."

