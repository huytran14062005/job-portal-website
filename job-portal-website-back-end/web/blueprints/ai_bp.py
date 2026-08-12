from flask import Blueprint, jsonify, request

from web.blueprints.api_errors import handle_api_errors
from web.middleware.auth_middleware import verify_role, verify_token
from web.models import UserRole
from web.services.ai_cv_match_service import match_cv_to_job
from web.services.validators import require_int

ai_bp = Blueprint("ai", __name__, url_prefix="/api/ai")


@ai_bp.route("/cv-match", methods=["POST"])
@verify_token
@verify_role(UserRole.UNGVIEN)
@handle_api_errors
def cv_match():
    data = request.get_json(silent=True) or {}

    job_id = require_int(data.get("job_id"), "Công việc")
    cv_id = require_int(data.get("cv_id"), "CV cần phân tích")

    try:
        result = match_cv_to_job(job_id, cv_id, request.user_id)
    except RuntimeError as ex:

        print(f"[AI CV match runtime error] {ex}")
        return jsonify({"error": str(ex)}), 502

    return jsonify({"match": result, "job_id": job_id, "cv_id": cv_id}), 200
