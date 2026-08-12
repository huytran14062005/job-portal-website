from flask import Blueprint, jsonify, request

from web.blueprints.api_errors import handle_api_errors
from web.middleware.auth_middleware import verify_role, verify_token
from web.models import UserRole
from web.services.admin_stats_service import (
    get_company_statistics_service,
    get_user_registration_statistics_service,
)

admin_stats_bp = Blueprint('admin_stats', __name__, url_prefix='/api/admin/stats')


@admin_stats_bp.route('/companies', methods=['GET'])
@verify_token
@verify_role(UserRole.ADMIN)
@handle_api_errors
def get_company_stats():
    companies, summary, from_date, to_date = get_company_statistics_service(
        request.args.get('from_date'),
        request.args.get('to_date')
    )

    return jsonify({
        'companies': companies,
        'summary': summary,
        'from_date': from_date.isoformat() if from_date else None,
        'to_date': to_date.isoformat() if to_date else None
    }), 200


@admin_stats_bp.route('/users', methods=['GET'])
@verify_token
@verify_role(UserRole.ADMIN)
@handle_api_errors
def get_user_stats():
    points, summary, from_date, to_date = get_user_registration_statistics_service(
        request.args.get('from_date'),
        request.args.get('to_date')
    )

    return jsonify({
        'points': points,
        'summary': summary,
        'from_date': from_date.isoformat() if from_date else None,
        'to_date': to_date.isoformat() if to_date else None
    }), 200
