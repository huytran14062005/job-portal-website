from flask import Blueprint, jsonify, request

from web.blueprints.api_errors import handle_api_errors
from web.middleware.auth_middleware import verify_role, verify_token
from web.models import UserRole
from web.services.admin_user_service import (
    get_user_detail_service,
    get_users_list_service,
    set_user_lock_service,
    update_user_profile_service,
)
from web.utils.pagination import build_pagination
from web.utils.public_cache import invalidate_public_cache

admin_users_bp = Blueprint('admin_users', __name__, url_prefix='/api/admin/users')


@admin_users_bp.route('', methods=['GET'])
@verify_token
@verify_role(UserRole.QUANTRIVIEN)
@handle_api_errors
def get_users_list():
    users, total, page, per_page = get_users_list_service(
        page_value=request.args.get('page'),
        per_page_value=request.args.get('per_page'),
        role_value=request.args.get('role'),
        keyword=request.args.get('keyword')
    )

    users_data = [{
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'role': user.role.value,
        'is_locked': user.is_locked,
        'created_at': user.created_at.isoformat() if user.created_at else None
    } for user in users]

    return jsonify({
        'users': users_data,
        'pagination': build_pagination(page, per_page, total)
    }), 200


@admin_users_bp.route('/<int:user_id>', methods=['GET'])
@verify_token
@verify_role(UserRole.QUANTRIVIEN)
@handle_api_errors
def get_user_detail(user_id):
    return jsonify(get_user_detail_service(user_id)), 200


@admin_users_bp.route('/<int:user_id>/lock', methods=['PUT'])
@verify_token
@verify_role(UserRole.QUANTRIVIEN)
@handle_api_errors
def set_user_lock(user_id):
    data = request.get_json(silent=True) or {}
    user = set_user_lock_service(
        user_id=user_id,
        actor_id=request.user_id,
        is_locked=data.get('is_locked')
    )
    invalidate_public_cache()

    return jsonify({
        "message": "Đã khóa tài khoản" if user.is_locked else "Đã mở khóa tài khoản",
        "user_id": user.id,
        "is_locked": user.is_locked
    }), 200


@admin_users_bp.route('/<int:user_id>/profile', methods=['PUT'])
@verify_token
@verify_role(UserRole.QUANTRIVIEN)
@handle_api_errors
def update_user_profile(user_id):
    data = request.get_json(silent=True) or {}

    updated_user = update_user_profile_service(user_id, data)

    return jsonify({
        "message": "Cập nhật profile thành công",
        "user": updated_user
    }), 200
