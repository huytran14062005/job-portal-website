import math

from flask import Blueprint, jsonify, request

from web import app, dao
from web.blueprints.api_errors import handle_api_errors
from web.middleware.auth_middleware import verify_role, verify_token
from web.models import UserRole
from web.services.job_service import (
    get_job_detail_service,
    get_saved_job_statuses_service,
    toggle_save_job_service,
)

jobs_bp = Blueprint('jobs', __name__, url_prefix='/api/jobs')


def _read_job_filters():
    return {
        'page': int(request.args.get('page', 1)),
        'limit': request.args.get('limit', type=int),
        'keyword': request.args.get('keyword', '').strip() or None,
        'location_id': request.args.get('location_id', type=int),
        'job_type_id': request.args.get('job_type_id', type=int),
        'min_salary_filter': request.args.get('min_salary', type=int),
        'max_salary_filter': request.args.get('max_salary', type=int),
    }


def _paged_jobs_response(filters, jobs, total):
    actual_limit = filters['limit'] or app.config.get("APPLICATION_SIZE", 10)

    return jsonify({
        'jobs': jobs,
        'total': total,
        'page': filters['page'],
        'limit': actual_limit,
        'total_pages': math.ceil(total / actual_limit)
    }), 200


@jobs_bp.route('', methods=['GET'])
@handle_api_errors
def get_jobs_public():
    filters = _read_job_filters()

    jobs, total = dao.get_jobs(user_id=None, is_saved=False, **filters)

    return _paged_jobs_response(filters, jobs, total)


@jobs_bp.route('/saved', methods=['GET'])
@verify_token
@verify_role(UserRole.UNGVIEN)
@handle_api_errors
def get_saved_jobs():
    filters = _read_job_filters()

    jobs, total = dao.get_jobs(user_id=request.user_id, is_saved=True, **filters)

    return _paged_jobs_response(filters, jobs, total)


@jobs_bp.route('/saved-statuses', methods=['GET'])
@verify_token
@verify_role(UserRole.UNGVIEN)
@handle_api_errors
def get_saved_job_statuses():
    saved_job_ids = get_saved_job_statuses_service(
        request.user_id,
        request.args.get('job_ids', '')
    )

    return jsonify({"saved_job_ids": saved_job_ids}), 200


@jobs_bp.route('/<int:job_id>', methods=['GET'])
@handle_api_errors
def get_job_detail_view(job_id):
    return jsonify(get_job_detail_service(job_id)), 200


@jobs_bp.route('/<int:job_id>/save', methods=['POST'])
@verify_token
@verify_role(UserRole.UNGVIEN)
@handle_api_errors
def save_job_view(job_id):
    return jsonify(toggle_save_job_service(request.user_id, job_id)), 200


@jobs_bp.route('/<int:job_id>/check-saved', methods=['GET'])
@verify_token
@verify_role(UserRole.UNGVIEN)
@handle_api_errors
def check_job_saved_view(job_id):
    return jsonify({
        "job_id": job_id,
        "is_saved": dao.check_job_saved(request.user_id, job_id)
    }), 200


@jobs_bp.route('/<int:job_id>/related', methods=['GET'])
@handle_api_errors
def get_related_jobs_view(job_id):
    limit = request.args.get('limit', 5, type=int)
    related_jobs = dao.get_related_jobs(job_id, limit)

    return jsonify({
        'jobs': related_jobs,
        'total': len(related_jobs)
    }), 200
