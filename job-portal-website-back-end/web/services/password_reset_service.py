import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta

from flask_mail import Message

from web import dao, mail
from web.services.exceptions import AppError, NotFoundError, ValidationError
from web.services.validators import (
    require_otp_code,
    validate_password_confirmation,
    validate_password_strength,
)


OTP_TTL = timedelta(minutes=5)       
MAX_OTP_ATTEMPTS = 5                 
RESET_TOKEN_TTL = timedelta(minutes=10)  


_password_reset_requests = {}
_password_reset_tokens = {}


def _cleanup_expired_state():
    now = datetime.utcnow()

    for store in (_password_reset_requests, _password_reset_tokens):
        expired = [key for key, value in store.items() if value["expires_at"] <= now]
        for key in expired:
            store.pop(key, None)


def _otp_digest(otp):
    secret = str(os.getenv("SECRET_KEY", "dev")).encode("utf-8")
    return hmac.new(secret, otp.encode("utf-8"), hashlib.sha256).hexdigest()


def _send_otp_email(user, otp):
    message = Message(
        subject="Mã OTP khôi phục mật khẩu - Job Portal",
        recipients=[user.email],
        body=(
            f"Xin chào {user.username},\n\n"
            f"Mã OTP khôi phục mật khẩu của bạn là: {otp}\n"
            f"Mã có hiệu lực trong {int(OTP_TTL.total_seconds() // 60)} phút "
            "và chỉ được sử dụng một lần.\n\n"
            "Nếu bạn không yêu cầu đổi mật khẩu, hãy bỏ qua email này."
        ),
    )
    mail.send(message)


def request_password_reset_service(email):
    clean_email = str(email or '').strip().lower()

    
    if not clean_email:
        raise ValidationError("Vui lòng nhập email.")

    _cleanup_expired_state()

    
    user = dao.get_user_by_email_insensitive(clean_email)
    if not user:
        raise NotFoundError("Email chưa được đăng ký.")

    
    otp = f"{secrets.randbelow(1_000_000):06d}"
    challenge_token = secrets.token_urlsafe(32)
    _password_reset_requests[challenge_token] = {
        "email": clean_email,
        "user_id": user.id,
        "otp_digest": _otp_digest(otp),
        "expires_at": datetime.utcnow() + OTP_TTL,
        "attempts": 0,
    }

    _send_otp_email(user, otp)

    return challenge_token


def verify_password_reset_otp_service(email, otp, challenge_token):
    clean_email = str(email or '').strip().lower()

    
    clean_otp = require_otp_code(otp)

    _cleanup_expired_state()

    
    challenge = _password_reset_requests.get(challenge_token)
    if not challenge or challenge["email"] != clean_email:
        raise ValidationError("Yêu cầu OTP không hợp lệ hoặc đã hết hạn.")

    
    if challenge["attempts"] >= MAX_OTP_ATTEMPTS:
        _password_reset_requests.pop(challenge_token, None)
        raise AppError("Bạn đã nhập sai OTP quá số lần cho phép.", status_code=429)

    if not hmac.compare_digest(challenge["otp_digest"], _otp_digest(clean_otp)):
        challenge["attempts"] += 1
        remaining = MAX_OTP_ATTEMPTS - challenge["attempts"]
        raise ValidationError(f"Mã OTP không đúng. Bạn còn {remaining} lần thử.")

    
    _password_reset_requests.pop(challenge_token, None)

    reset_token = secrets.token_urlsafe(32)
    _password_reset_tokens[reset_token] = {
        "email": clean_email,
        "user_id": challenge["user_id"],
        "expires_at": datetime.utcnow() + RESET_TOKEN_TTL,
    }

    return reset_token


def reset_password_service(reset_token, new_password, confirm_password=None):
    _cleanup_expired_state()

    
    reset_request = _password_reset_tokens.get(reset_token)
    if not reset_request:
        raise ValidationError("Token đổi mật khẩu không hợp lệ hoặc đã hết hạn.")

    
    validate_password_strength(new_password)

    
    if confirm_password is not None:
        validate_password_confirmation(new_password, confirm_password)

    user = dao.get_user_by_id(reset_request["user_id"])
    if not user:
        raise NotFoundError("Tài khoản không tồn tại.")

    dao.update_user_password(user, new_password)

    
    _password_reset_tokens.pop(reset_token, None)

    return user
