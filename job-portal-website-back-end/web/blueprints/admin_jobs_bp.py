
import math

from flask import Blueprint, jsonify, request

import web.dao as dao
from web.blueprints.api_errors import handle_api_errors
from web.middleware.auth_middleware import verify_role, verify_token
from web.models import UserRole
from web.services.admin_job_service import (
    delete_job_service,
    get_job_detail_service,
    parse_post_status_filter,
    update_job_service,
    update_job_status_service,
)
from web.services.admin_user_service import parse_paging_args

admin_jobs_bp = Blueprint('admin_jobs', __name__, url_prefix='/api/admin/jobs')


@admin_jobs_bp.route('', methods=['GET'])
@verify_token
@verify_role(UserRole.ADMIN)
@handle_api_errors
def get_jobs_list():

    page, per_page = parse_paging_args(request.args.get('page'), request.args.get('per_page'))
    keyword = request.args.get('keyword', '').strip()

    company_id = request.args.get('company_id')
    company_id = int(company_id) if company_id else None

    jobs, total = dao.get_all_jobs(
        page=page,
        per_page=per_page,
        status=parse_post_status_filter(request.args.get('status')),
        company_id=company_id,
        keyword=keyword or None
    )

    return jsonify({
        'jobs': jobs,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': total,
            'total_pages': math.ceil(total / per_page) if per_page > 0 else 0
        }
    }), 200


@admin_jobs_bp.route('/<int:job_id>', methods=['GET'])
@verify_token
@verify_role(UserRole.ADMIN)
@handle_api_errors
def get_job_detail(job_id):
    return jsonify(get_job_detail_service(job_id)), 200


@admin_jobs_bp.route('/<int:job_id>', methods=['PUT'])
@verify_token
@verify_role(UserRole.ADMIN)
@handle_api_errors
def update_job(job_id):
    data = request.get_json(silent=True) or {}

    return jsonify({
        "message": "Cập nhật bài đăng thành công",
        "job": update_job_service(job_id, data)
    }), 200


@admin_jobs_bp.route('/<int:job_id>/status', methods=['PUT'])
@verify_token
@verify_role(UserRole.ADMIN)
@handle_api_errors
def update_job_status(job_id):
    data = request.get_json(silent=True) or {}

    return jsonify({
        "message": "Cập nhật trạng thái bài đăng thành công",
        "job": update_job_status_service(job_id, data.get('status', ''))
    }), 200


@admin_jobs_bp.route('/<int:job_id>', methods=['DELETE'])
@verify_token
@verify_role(UserRole.ADMIN)
@handle_api_errors
def delete_job(job_id):
    delete_job_service(job_id)

    return jsonify({
        "message": "Xóa bài đăng thành công",
        "job_id": job_id
    }), 200
