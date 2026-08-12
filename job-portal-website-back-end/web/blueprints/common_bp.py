import math

from flask import Blueprint, jsonify, request

from web import app, dao
from web.blueprints.api_errors import handle_api_errors
from web.middleware.auth_middleware import optional_token
from web.services.common_service import get_companies_service, get_company_detail_service

common_bp = Blueprint('common', __name__, url_prefix='/api')


@common_bp.route('/locations', methods=['GET'])
@handle_api_errors
def get_locations():
    locations = dao.get_all_locations()

    return jsonify({
        "locations": [{"id": loc.id, "name": loc.name} for loc in locations],
        "total": len(locations)
    }), 200


@common_bp.route('/job-types', methods=['GET'])
@handle_api_errors
def get_job_types():
    job_types = dao.get_all_job_types()

    return jsonify({
        "job_types": [{"id": jt.id, "name": jt.name} for jt in job_types],
        "total": len(job_types)
    }), 200


@common_bp.route('/industries', methods=['GET'])
@handle_api_errors
def get_industries():
    industries = dao.get_all_industries()

    return jsonify({
        "industries": industries,
        "total": len(industries)
    }), 200


@common_bp.route('/companies', methods=['GET'])
@optional_token
@handle_api_errors
def get_companies():
    companies, total, page = get_companies_service(
        page_value=request.args.get('page'),
        keyword=request.args.get('keyword'),
        industry=request.args.get('industry'),
        user_id=getattr(request, 'user_id', None),
        user_role=getattr(request, 'user_role', None),
        follow_filter=request.args.get('follow_filter')
    )

    return jsonify({
        "companies": companies,
        "total": total,
        "pages": math.ceil(total / app.config["APPLICATION_SIZE"]),
        "current_page": page
    }), 200


@common_bp.route('/companies/<int:company_id>', methods=['GET'])
@handle_api_errors
def get_company_detail(company_id):
    return jsonify(get_company_detail_service(company_id)), 200


@common_bp.route('/companies/<int:company_id>/jobs', methods=['GET'])
@handle_api_errors
def get_company_jobs_public(company_id):
    page = int(request.args.get('page', 1))

    jobs, total = dao.get_jobs_by_company(company_id, page)

    return jsonify({
        "jobs": jobs,
        "total": total,
        "pages": math.ceil(total / app.config["APPLICATION_SIZE"]),
        "current_page": page
    }), 200
