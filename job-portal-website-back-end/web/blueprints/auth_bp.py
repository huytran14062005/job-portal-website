import os

import jwt
from flask import Blueprint, jsonify, request

from web.blueprints.api_errors import handle_api_errors
from web.middleware.auth_middleware import verify_token
from web.services.auth_service import login_service, parse_register_role, register_service
from web.services.firebase_auth_service import generate_firebase_token
from web.services.password_reset_service import (
    request_password_reset_service,
    reset_password_service,
    verify_password_reset_otp_service,
)

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@auth_bp.route('/login', methods=['POST'])
@handle_api_errors
def login_process():
    data = request.get_json(silent=True) or {}

    user = login_service(data.get('username', ''), data.get('password', ''))

    token = jwt.encode({
        'user_id': user.id,
        'username': user.username,
        'role': user.role.value
    }, os.getenv("JWT_SECRET", "secret"), algorithm="HS256")

    return jsonify({
        "message": "Đăng nhập thành công",
        "token": token,
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role.value
        }
    }), 200


@auth_bp.route('/logout', methods=['POST'])
@verify_token
def logout_process():
    return jsonify({"message": "Đăng xuất thành công"}), 200


@auth_bp.route('/register', methods=['POST'])
@handle_api_errors
def register_process():
    data = request.get_json(silent=True) or {}

    register_service(
        username=data.get('username', ''),
        email=data.get('email', ''),
        password=data.get('password', ''),
        confirm=data.get('confirm', ''),
        role=parse_register_role(data.get('role', ''))
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
    user_id = request.user_id
    user_role = request.user_role

    firebase_token = generate_firebase_token(
        user_id=user_id,
        additional_claims={
            'role': user_role.value if hasattr(user_role, 'value') else str(user_role)
        }
    )

    return jsonify({
        "firebase_token": firebase_token,
        "user_id": user_id
    }), 200
