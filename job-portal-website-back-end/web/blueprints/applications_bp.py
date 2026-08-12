import math

from flask import Blueprint, jsonify, request

from web import app, dao
from web.blueprints.api_errors import handle_api_errors
from web.middleware.auth_middleware import verify_role, verify_token
from web.models import UserRole
from web.services.application_service import (
    apply_job_service,
    get_apply_state_service,
    get_reapply_info,
)

applications_bp = Blueprint('applications', __name__, url_prefix='/api')


@applications_bp.route('/applications/candidate', methods=['GET'])
@verify_token
@verify_role(UserRole.UNGVIEN)
@handle_api_errors
def my_applications_view():
    page = int(request.args.get("page", 1))

    applications, total = dao.get_application_of_own_candidate(
        candidate_id=request.user_id, page=page
    )
    pages = math.ceil(total / app.config["APPLICATION_SIZE"])

    applications_list = []
    for a in applications:
        reapply_info = get_reapply_info(a, a.job_status, a.job_deadline)

        applications_list.append({
            "id": a.id,
            "job_post_id": a.job_post_id,
            "cv_url": a.cv_url,
            "status": a.status.value,
            "applied_at": a.applied_at.isoformat(),
            "job_title": a[5],
            "company_name": a[6],
            "rejected_at": a.rejected_at.isoformat() if a.rejected_at else None,
            "max_apply_times": app.config["MAX_APPLY_TIMES"],
            **reapply_info
        })

    return jsonify({
        "applications": applications_list,
        "total": total,
        "pages": pages,
        "current_page": page
    }), 200


@applications_bp.route('/jobs/<int:job_id>/apply', methods=['POST'])
@verify_token
@verify_role(UserRole.UNGVIEN)
@handle_api_errors
def apply_job_view(job_id):
    application = apply_job_service(
        candidate_id=request.user_id,
        job_post_id=job_id,
        cv_file=request.files.get('cv'),
        cv_file_id=request.form.get('cv_file_id', type=int)
    )

    is_reapply = (application.apply_count or 1) > 1

    return jsonify({
        "message": "Nộp lại đơn ứng tuyển thành công" if is_reapply else "Nộp đơn ứng tuyển thành công",
        "application": {
            "id": application.id,
            "job_post_id": application.job_post_id,
            "cv_url": application.cv_url,
            "cv_file_id": application.cv_file_id,
            "status": application.status.value,
            "applied_at": application.applied_at.strftime('%d-%m-%Y %H:%M:%S'),
            "apply_count": application.apply_count,
            "attempts_left": max(
                app.config["MAX_APPLY_TIMES"] - (application.apply_count or 1), 0
            )
        }
    }), 201


@applications_bp.route('/jobs/<int:job_id>/check-applied', methods=['GET'])
@verify_token
@verify_role(UserRole.UNGVIEN)
@handle_api_errors
def check_applied_view(job_id):
    return jsonify(get_apply_state_service(request.user_id, job_id)), 200
