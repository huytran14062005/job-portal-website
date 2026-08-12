import math

from flask import Blueprint, jsonify, request

from web import app
from web.blueprints.api_errors import handle_api_errors
from web.middleware.auth_middleware import verify_role, verify_token
from web.models import UserRole
from web.services.cv_service import (
    delete_cvs_service,
    get_cv_list_service,
    update_cv_name_service,
    upload_cv_service,
)

cvs_bp = Blueprint('cvs', __name__, url_prefix='/api/cvs')


def _cv_to_dict(cv):
    return {
        "id": cv.id,
        "name": cv.name,
        "cv_url": cv.cv_url,
        "file_name": cv.file_name,
        "file_size": cv.file_size,
        "uploaded_at": cv.uploaded_at.strftime('%d-%m-%Y %H:%M:%S') if cv.uploaded_at else None
    }


@cvs_bp.route('', methods=['POST'])
@verify_token
@verify_role(UserRole.UNGVIEN)
@handle_api_errors
def upload_cv():
    cv_record = upload_cv_service(
        candidate_id=request.user_id,
        cv_file=request.files.get('cv'),
        name=request.form.get('name', '').strip() or None
    )

    return jsonify({
        "message": "Upload CV thành công",
        "cv": _cv_to_dict(cv_record)
    }), 201


@cvs_bp.route('', methods=['GET'])
@verify_token
@verify_role(UserRole.UNGVIEN)
@handle_api_errors
def get_cvs():
    page = int(request.args.get('page', 1))
    search = request.args.get('search', '').strip() or None

    cvs, total = get_cv_list_service(request.user_id, page, search)
    pages = math.ceil(total / app.config["APPLICATION_SIZE"])

    return jsonify({
        "cvs": [_cv_to_dict(cv) for cv in cvs],
        "total": total,
        "pages": pages,
        "current_page": page
    }), 200


@cvs_bp.route('/<int:cv_id>', methods=['PUT'])
@verify_token
@verify_role(UserRole.UNGVIEN)
@handle_api_errors
def update_cv(cv_id):
    data = request.get_json(silent=True) or {}
    new_name = data.get('name', '')

    update_cv_name_service(cv_id, request.user_id, new_name)

    return jsonify({
        "message": "Đổi tên CV thành công",
        "cv_id": cv_id,
        "new_name": new_name.strip()
    }), 200


@cvs_bp.route('', methods=['DELETE'])
@verify_token
@verify_role(UserRole.UNGVIEN)
@handle_api_errors
def delete_cvs():
    data = request.get_json(silent=True) or {}

    result = delete_cvs_service(request.user_id, data.get('cv_ids', []))

    return jsonify({
        "message": "Xóa CV thành công",
        **result
    }), 200
