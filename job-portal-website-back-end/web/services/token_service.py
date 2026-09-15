import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from flask import current_app

from web import db
from web.models import RefreshSession, User
from web.services.exceptions import AuthenticationError


def create_access_token(user):
    issued_at = datetime.now(timezone.utc)
    expires_at = issued_at + timedelta(
        seconds=current_app.config["JWT_ACCESS_TOKEN_EXPIRES_SECONDS"]
    )

    return jwt.encode({
        "user_id": user.id,
        "username": user.username,
        "role": user.role.value,
        "iat": issued_at,
        "exp": expires_at,
    }, current_app.config["JWT_SECRET"], algorithm="HS256")


def _hash_refresh_token(token):
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _new_refresh_token():
    token = secrets.token_urlsafe(48)
    expires_at = datetime.now() + timedelta(
        days=current_app.config["JWT_REFRESH_TOKEN_EXPIRES_DAYS"]
    )
    return token, expires_at


def _commit_changes():
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise


def create_refresh_session(user):
    token, expires_at = _new_refresh_token()
    refresh_session = RefreshSession(
        user_id=user.id,
        token_hash=_hash_refresh_token(token),
        expires_at=expires_at,
    )

    db.session.add(refresh_session)
    _commit_changes()

    return token


def validate_refresh_session(token):
    if not token:
        raise AuthenticationError("Phiên đăng nhập không tồn tại")

    now = datetime.now()
    refresh_session = (
        RefreshSession.query
        .filter(RefreshSession.token_hash == _hash_refresh_token(token))
        .first()
    )

    if not refresh_session or refresh_session.revoked_at or refresh_session.expires_at <= now:
        raise AuthenticationError("Phiên đăng nhập đã hết hạn")

    user = User.query.get(refresh_session.user_id)
    if not user or user.is_locked:
        raise AuthenticationError("Tài khoản không thể tiếp tục đăng nhập")

    return user


def revoke_refresh_session(token):
    if not token:
        return False

    refresh_session = RefreshSession.query.filter(
        RefreshSession.token_hash == _hash_refresh_token(token),
        RefreshSession.revoked_at.is_(None),
    ).first()

    if not refresh_session:
        return False

    refresh_session.revoked_at = datetime.now()
    _commit_changes()

    return True


def revoke_user_refresh_sessions(user_id):
    now = datetime.now()

    RefreshSession.query.filter(
        RefreshSession.user_id == user_id,
        RefreshSession.revoked_at.is_(None),
    ).update({RefreshSession.revoked_at: now}, synchronize_session=False)
    _commit_changes()
