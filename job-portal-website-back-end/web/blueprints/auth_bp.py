from flask import Blueprint, current_app, jsonify, request

from web.blueprints.api_errors import handle_api_errors
from web.middleware.auth_middleware import verify_token
from web.models import User
from web.services.auth_service import login_service, register_service
from web.services.firebase_auth_service import generate_firebase_token
from web.services.password_reset_service import (
    request_password_reset_service,
    reset_password_service,
    verify_password_reset_otp_service,
)
from web.services.token_service import (
    create_access_token,
    create_refresh_session,
    revoke_refresh_session,
    validate_refresh_session,
)

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


def _set_refresh_cookie(response, token):
    max_age = current_app.config["JWT_REFRESH_TOKEN_EXPIRES_DAYS"] * 24 * 60 * 60
    secure = current_app.config["REFRESH_COOKIE_SECURE"]
    samesite = current_app.config["REFRESH_COOKIE_SAMESITE"]
    partitioned = secure and str(samesite).lower() == "none"

    response.set_cookie(
        key=current_app.config["REFRESH_COOKIE_NAME"],
        value=token,
        max_age=max_age,
        httponly=True,
        secure=secure,
        samesite=samesite,
        partitioned=partitioned,
        path="/api/auth",
    )
    return response


def _clear_refresh_cookie(response):
    secure = current_app.config["REFRESH_COOKIE_SECURE"]
    samesite = current_app.config["REFRESH_COOKIE_SAMESITE"]
    partitioned = secure and str(samesite).lower() == "none"

    response.delete_cookie(
        key=current_app.config["REFRESH_COOKIE_NAME"],
        secure=secure,
        samesite=samesite,
        partitioned=partitioned,
        path="/api/auth",
    )
    return response


@auth_bp.route('/login', methods=['POST'])
@handle_api_errors
def login_process():
    data = request.get_json(silent=True) or {}

    user = login_service(data.get('username', ''), data.get('password', ''))

    access_token = create_access_token(user)
    refresh_token = create_refresh_session(user)

    response = jsonify({
        "message": "Đăng nhập thành công",
        "token": access_token,
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role.value,
            "chat_uid": user.chat_uid
        }
    })

    return _set_refresh_cookie(response, refresh_token), 200


@auth_bp.route('/refresh', methods=['POST'])
@handle_api_errors
def refresh_access_token():
    refresh_token = request.cookies.get(current_app.config["REFRESH_COOKIE_NAME"])
    user = validate_refresh_session(refresh_token)

    response = jsonify({"token": create_access_token(user)})
    return response, 200


@auth_bp.route('/logout', methods=['POST'])
@handle_api_errors
def logout_process():
    refresh_token = request.cookies.get(current_app.config["REFRESH_COOKIE_NAME"])
    revoke_refresh_session(refresh_token)

    response = jsonify({"message": "Đăng xuất thành công"})
    return _clear_refresh_cookie(response), 200


@auth_bp.route('/register', methods=['POST'])
@handle_api_errors
def register_process():
    data = request.get_json(silent=True) or {}

    register_service(
        username=data.get('username', ''),
        email=data.get('email', ''),
        password=data.get('password', ''),
        confirm=data.get('confirm', ''),
        role=data.get('role', '')
    )

    return jsonify({"message": "Đăng ký thành công"}), 201


@auth_bp.route('/forgot-password/request', methods=['POST'])
@handle_api_errors
def request_password_reset():
    data = request.get_json(silent=True) or {}

    challenge_token = request_password_reset_service(data.get('email', ''))

    return jsonify({
        "message": "Mã OTP đã được gửi đến email của bạn.",
        "challenge_token": challenge_token,
    }), 200


@auth_bp.route('/forgot-password/verify', methods=['POST'])
@handle_api_errors
def verify_password_reset_otp():
    data = request.get_json(silent=True) or {}

    reset_token = verify_password_reset_otp_service(
        email=data.get('email', ''),
        otp=data.get('otp', ''),
        challenge_token=data.get('challenge_token') or data.get('challengeToken')
    )

    return jsonify({"reset_token": reset_token}), 200


@auth_bp.route('/forgot-password/reset', methods=['POST'])
@handle_api_errors
def reset_password():
    data = request.get_json(silent=True) or {}

    confirm = data.get('confirm_password', data.get('confirmPassword'))

    reset_password_service(
        reset_token=data.get('reset_token') or data.get('resetToken'),
        new_password=str(data.get('new_password', '') or data.get('newPassword', '')),
        confirm_password=None if confirm is None else str(confirm)
    )

    return jsonify({"message": "Đổi mật khẩu thành công."}), 200


@auth_bp.route('/firebase-token', methods=['GET'])
@verify_token
@handle_api_errors
def get_firebase_token():
    user = User.query.get(request.user_id)
    firebase_uid = user.chat_uid

    firebase_token = generate_firebase_token(
        firebase_uid=firebase_uid,
        additional_claims={
            'role': user.role.value
        }
    )

    return jsonify({
        "firebase_token": firebase_token,
        "firebase_uid": firebase_uid
    }), 200
