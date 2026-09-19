
from flask import Blueprint, jsonify, request

import web.dao as dao
from web.blueprints.api_errors import handle_api_errors
from web.middleware.auth_middleware import verify_role, verify_token
from web.models import UserRole
from web.services.admin_job_service import (
    get_job_detail_service,
    parse_post_status_filter,
    update_job_status_service,
)
from web.services.admin_user_service import parse_paging_args
from web.utils.pagination import build_pagination
from web.utils.public_cache import invalidate_public_cache

admin_jobs_bp = Blueprint('admin_jobs', __name__, url_prefix='/api/admin/jobs')


@admin_jobs_bp.route('', methods=['GET'])
@verify_token
@verify_role(UserRole.QUANTRIVIEN)
@handle_api_errors
def get_jobs_list():

    page, per_page = parse_paging_args(request.args.get('page'), request.args.get('per_page'))
    keyword = request.args.get('keyword', '').strip()

    jobs, total = dao.get_all_jobs(
        page=page,
        per_page=per_page,
        status=parse_post_status_filter(request.args.get('status')),
        keyword=keyword or None
    )

    return jsonify({
        'jobs': jobs,
        'pagination': build_pagination(page, per_page, total)
    }), 200

@admin_jobs_bp.route('/<int:job_id>', methods=['GET'])
@verify_token
@verify_role(UserRole.QUANTRIVIEN)
@handle_api_errors
def get_job_detail(job_id):
    return jsonify(get_job_detail_service(job_id)), 200


@admin_jobs_bp.route('/<int:job_id>/status', methods=['PUT'])
@verify_token
@verify_role(UserRole.QUANTRIVIEN)
@handle_api_errors
def update_job_status(job_id):
    data = request.get_json(silent=True) or {}
    job = update_job_status_service(job_id, data.get('status', ''))
    invalidate_public_cache()

    return jsonify({
        "message": "Cập nhật trạng thái bài đăng thành công",
        "job": job
    }), 200
