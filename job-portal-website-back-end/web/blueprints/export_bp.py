from flask import Blueprint, request, send_file

from web.blueprints.api_errors import handle_api_errors
from web.middleware.auth_middleware import verify_company_approved, verify_role, verify_token
from web.models import UserRole
from web.services.export_service import (
    export_candidate_applications_service,
    export_company_applications_service,
)

export_bp = Blueprint('export', __name__, url_prefix='/api/export')

EXCEL_MIMETYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'


@export_bp.route('/applications', methods=['GET'])
@verify_token
@verify_role(UserRole.NHATUYENDUNG)
@verify_company_approved
@handle_api_errors
def export_applications():
    output, filename = export_company_applications_service(
        company_id=request.user_id,
        job_id=request.args.get('job_id', type=int),
        status_value=request.args.get('status', '')
    )

    return send_file(output, mimetype=EXCEL_MIMETYPE, as_attachment=True, download_name=filename)


@export_bp.route('/my-applications', methods=['GET'])
@verify_token
@verify_role(UserRole.UNGVIEN)
@handle_api_errors
def export_my_applications():
    output, filename = export_candidate_applications_service(candidate_id=request.user_id)

    return send_file(output, mimetype=EXCEL_MIMETYPE, as_attachment=True, download_name=filename)
