from flask import Blueprint, jsonify, request

from web.blueprints.api_errors import handle_api_errors
from web.dao import company_follow_dao
from web.middleware.auth_middleware import verify_role, verify_token
from web.models import UserRole
from web.services.company_follow_service import toggle_follow_company_service

company_follow_bp = Blueprint('company_follow', __name__, url_prefix='/api/companies')


@company_follow_bp.route('/<int:company_id>/follow', methods=['POST'])
@verify_token
@verify_role(UserRole.UNGVIEN)
@handle_api_errors
def follow_company_view(company_id):
    return jsonify(toggle_follow_company_service(request.user_id, company_id)), 200


@company_follow_bp.route('/<int:company_id>/check-followed', methods=['GET'])
@verify_token
@verify_role(UserRole.UNGVIEN)
@handle_api_errors
def check_company_followed_view(company_id):
    is_followed = company_follow_dao.check_company_followed(request.user_id, company_id)

    return jsonify({"is_followed": is_followed}), 200


@company_follow_bp.route('/<int:company_id>/followers-count', methods=['GET'])
@handle_api_errors
def get_followers_count_view(company_id):
    count = company_follow_dao.get_company_followers_count(company_id)

    return jsonify({"followers_count": count}), 200
