import math

from flask import Blueprint, jsonify, request

from web.blueprints.api_errors import handle_api_errors
from web.middleware.auth_middleware import verify_role, verify_token
from web.models import UserRole
from web.services.admin_user_service import (
    delete_user_service,
    get_user_detail_service,
    get_users_list_service,
    update_user_profile_service,
)

admin_users_bp = Blueprint('admin_users', __name__, url_prefix='/api/admin/users')


@admin_users_bp.route('', methods=['GET'])
@verify_token
@verify_role(UserRole.ADMIN)
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
        'created_at': user.created_at.isoformat() if user.created_at else None
    } for user in users]

    return jsonify({
        'users': users_data,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': total,
            'total_pages': math.ceil(total / per_page) if per_page > 0 else 0
        }
    }), 200


@admin_users_bp.route('/<int:user_id>', methods=['GET'])
@verify_token
@verify_role(UserRole.ADMIN)
@handle_api_errors
def get_user_detail(user_id):
    return jsonify(get_user_detail_service(user_id)), 200


@admin_users_bp.route('/<int:user_id>', methods=['DELETE'])
@verify_token
@verify_role(UserRole.ADMIN)
@handle_api_errors
def delete_user(user_id):
    delete_user_service(user_id, actor_id=request.user_id)

    return jsonify({
        "message": "Xóa user thành công",
        "user_id": user_id
    }), 200


@admin_users_bp.route('/<int:user_id>/profile', methods=['PUT'])
@verify_token
@verify_role(UserRole.ADMIN)
@handle_api_errors
def update_user_profile(user_id):
    data = request.get_json(silent=True) or {}

    updated_user = update_user_profile_service(user_id, data)

    return jsonify({
        "message": "Cập nhật profile thành công",
        "user": updated_user
    }), 200
