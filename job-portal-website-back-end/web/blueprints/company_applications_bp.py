import math

from flask import Blueprint, jsonify, request

from web import app, dao
from web.blueprints.api_errors import handle_api_errors
from web.middleware.auth_middleware import verify_company_approved, verify_role, verify_token
from web.models import UserRole
from web.services.application_service import (
    get_application_detail_service,
    parse_application_status_filter,
    update_application_status_service,
)

company_applications_bp = Blueprint('company_applications', __name__,
                                    url_prefix='/api/company/applications')


@company_applications_bp.route('', methods=['GET'])
@verify_token
@verify_role(UserRole.NHATUYENDUNG)
@verify_company_approved
@handle_api_errors
def get_company_applications():
    page = int(request.args.get('page', 1))

    applications, total = dao.get_applications_for_company(
        company_id=request.user_id,
        page=page,
        job_post_id=request.args.get('job_post_id', type=int),
        status=parse_application_status_filter(request.args.get('status', ''))
    )

    pages = math.ceil(total / app.config["APPLICATION_SIZE"])

    applications_list = []
    for app_item in applications:
        candidate = app_item.candidate
        job = app_item.job_post

        applications_list.append({
            "id": app_item.id,
            "job_post": {
                "id": job.id,
                "title": job.title,
                "deadline": job.deadline.strftime('%d-%m-%Y') if job.deadline else None
            },
            "candidate": {
                "id": candidate.id,
                "full_name": candidate.full_name,
                "email": candidate.user.email if candidate.user else None,
                "phone": candidate.phone,
                "avatar_url": candidate.avatar_url
            },
            "cv_url": app_item.cv_url,
            "cv_file_id": app_item.cv_file_id,
            "status": app_item.status.value,
            "applied_at": app_item.applied_at.strftime('%d-%m-%Y %H:%M:%S'),
            "apply_count": app_item.apply_count or 1
        })

    return jsonify({
        "applications": applications_list,
        "total": total,
        "pages": pages,
        "current_page": page
    }), 200


@company_applications_bp.route('/<int:application_id>', methods=['GET'])
@verify_token
@verify_role(UserRole.NHATUYENDUNG)
@verify_company_approved
@handle_api_errors
def get_application_detail(application_id):
    application = get_application_detail_service(application_id, request.user_id)

    candidate = application.candidate
    job = application.job_post

    return jsonify({
        "id": application.id,
        "job_post": {
            "id": job.id,
            "title": job.title,
            "min_salary": job.min_salary,
            "max_salary": job.max_salary,
            "description": job.description,
            "deadline": job.deadline.strftime('%d-%m-%Y') if job.deadline else None,
            "location_id": job.location_id,
            "job_type_id": job.job_type_id
        },
        "candidate": {
            "id": candidate.id,
            "full_name": candidate.full_name,
            "email": candidate.user.email if candidate.user else None,
            "phone": candidate.phone,
            "gender": candidate.gender.value if candidate.gender else None,
            "date_of_birth": candidate.date_of_birth.strftime('%d-%m-%Y') if candidate.date_of_birth else None,
            "address": candidate.address,
            "avatar_url": candidate.avatar_url,
            "description": candidate.description
        },
        "cv_url": application.cv_url,
        "cv_file_id": application.cv_file_id,
        "status": application.status.value,
        "applied_at": application.applied_at.strftime('%d-%m-%Y %H:%M:%S'),
        "apply_count": application.apply_count or 1
    }), 200


@company_applications_bp.route('/<int:application_id>/status', methods=['PUT'])
@verify_token
@verify_role(UserRole.NHATUYENDUNG)
@verify_company_approved
@handle_api_errors
def update_application_status_view(application_id):
    data = request.get_json(silent=True) or {}

    application = update_application_status_service(
        application_id=application_id,
        company_id=request.user_id,
        status_value=data.get('status', '')
    )

    return jsonify({
        "message": f"Cập nhật trạng thái thành '{application.status.value}' thành công",
        "application": {
            "id": application.id,
            "status": application.status.value,
            "candidate_name": application.candidate.full_name,
            "job_title": application.job_post.title
        }
    }), 200
