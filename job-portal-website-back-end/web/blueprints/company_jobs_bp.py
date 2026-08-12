import math

from flask import Blueprint, jsonify, request

from web import app, dao
from web.blueprints.api_errors import handle_api_errors
from web.middleware.auth_middleware import verify_company_approved, verify_role, verify_token
from web.models import UserRole
from web.services.job_post_service import (
    create_job_post_service,
    get_own_job_post_service,
    update_job_post_service,
    update_job_post_status_service,
)

company_jobs_bp = Blueprint('company_jobs', __name__, url_prefix='/api/company/jobs')


def _job_to_dict(job):
    return {
        "id": job.id,
        "title": job.title,
        "min_salary": job.min_salary,
        "max_salary": job.max_salary,
        "description": job.description,
        "deadline": job.deadline.strftime('%d-%m-%Y') if job.deadline else None,
        "status": job.status.value,
        "location_id": job.location_id,
        "job_type_id": job.job_type_id,
        "created_at": job.created_at.strftime('%d-%m-%Y %H:%M:%S') if job.created_at else None
    }


@company_jobs_bp.route('', methods=['POST'])
@verify_token
@verify_role(UserRole.NHATUYENDUNG)
@verify_company_approved
@handle_api_errors
def create_job_post():
    data = request.get_json(silent=True) or {}

    job_post = create_job_post_service(company_id=request.user_id, data=data)

    return jsonify({
        "message": "Tạo job post thành công",
        "job_post": _job_to_dict(job_post)
    }), 201


@company_jobs_bp.route('', methods=['GET'])
@verify_token
@verify_role(UserRole.NHATUYENDUNG)
@verify_company_approved
@handle_api_errors
def get_company_jobs():
    page = int(request.args.get('page', 1))

    jobs, total = dao.get_company_job_posts(request.user_id, page)
    pages = math.ceil(total / app.config["APPLICATION_SIZE"])

    return jsonify({
        "jobs": [_job_to_dict(job) for job in jobs],
        "total": total,
        "pages": pages,
        "current_page": page
    }), 200


@company_jobs_bp.route('/<int:job_id>', methods=['GET'])
@verify_token
@verify_role(UserRole.NHATUYENDUNG)
@verify_company_approved
@handle_api_errors
def get_company_job_detail(job_id):
    job = get_own_job_post_service(job_id, request.user_id)

    return jsonify(_job_to_dict(job)), 200


@company_jobs_bp.route('/<int:job_id>', methods=['PUT'])
@verify_token
@verify_role(UserRole.NHATUYENDUNG)
@verify_company_approved
@handle_api_errors
def update_job_post(job_id):
    data = request.get_json(silent=True) or {}

    job_post = update_job_post_service(job_id=job_id, company_id=request.user_id, data=data)

    return jsonify({
        "message": "Cập nhật job post thành công",
        "job_post": _job_to_dict(job_post)
    }), 200


@company_jobs_bp.route('/<int:job_id>/status', methods=['PUT'])
@verify_token
@verify_role(UserRole.NHATUYENDUNG)
@verify_company_approved
@handle_api_errors
def update_job_status(job_id):
    data = request.get_json(silent=True) or {}

    job_post = update_job_post_status_service(job_id, request.user_id, data.get('status', ''))

    return jsonify({
        "message": "Cập nhật trạng thái thành công",
        "job_post": {
            "id": job_post.id,
            "status": job_post.status.value
        }
    }), 200
