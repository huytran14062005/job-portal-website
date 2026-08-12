import math
from flask import Blueprint, jsonify, request

import web.dao as dao
from web.blueprints.api_errors import handle_api_errors
from web.middleware.auth_middleware import verify_role, verify_token
from web.models import UserRole
from web.services.admin_company_service import (
    approve_company_service,
    delete_company_service,
    get_company_detail_service,
    parse_company_status_filter,
    reject_company_service,
    update_company_service,
)
from web.services.admin_user_service import parse_paging_args
from web.utils.notification_helper import (
    emit_company_status_changed,
    notify_company_approved,
    notify_company_rejected,
)

admin_companies_bp = Blueprint('admin_companies', __name__, url_prefix='/api/admin/companies')


def _company_to_dict(company):
    return {
        'id': company.id,
        'company_name': company.company_name,
        'logo_url': company.logo_url,
        'industry': company.industry,
        'company_size': company.company_size,
        'website': company.website,
        'address': company.address,
        'status': company.status.value if company.status else None,
        'created_at': company.user.created_at.isoformat() if company.user and company.user.created_at else None
    }


def _build_pagination(page, per_page, total):
    return {
        'page': page,
        'per_page': per_page,
        'total': total,
        'total_pages': math.ceil(total / per_page) if per_page > 0 else 0
    }


@admin_companies_bp.route('', methods=['GET'])
@verify_token
@verify_role(UserRole.ADMIN)
@handle_api_errors
def get_companies_list():

    page, per_page = parse_paging_args(request.args.get('page'), request.args.get('per_page'))
    keyword = request.args.get('keyword', '').strip()

    companies, total = dao.get_all_companies(
        page=page,
        per_page=per_page,
        status=parse_company_status_filter(request.args.get('status')),
        keyword=keyword or None
    )

    return jsonify({
        'companies': [_company_to_dict(company) for company in companies],
        'pagination': _build_pagination(page, per_page, total)
    }), 200


@admin_companies_bp.route('/pending', methods=['GET'])
@verify_token
@verify_role(UserRole.ADMIN)
@handle_api_errors
def get_pending_companies():

    page, per_page = parse_paging_args(request.args.get('page'), request.args.get('per_page'))

    companies, total = dao.get_pending_companies(page=page, per_page=per_page)

    return jsonify({
        'companies': [_company_to_dict(company) for company in companies],
        'pagination': _build_pagination(page, per_page, total)
    }), 200


@admin_companies_bp.route('/<int:company_id>', methods=['GET'])
@verify_token
@verify_role(UserRole.ADMIN)
@handle_api_errors
def get_company_detail(company_id):
    return jsonify(get_company_detail_service(company_id)), 200


@admin_companies_bp.route('/<int:company_id>', methods=['PUT'])
@verify_token
@verify_role(UserRole.ADMIN)
@handle_api_errors
def update_company(company_id):

    data = request.get_json(silent=True) or {}

    updated_company = update_company_service(company_id, data)

    return jsonify({
        "message": "Cập nhật công ty thành công",
        "company": updated_company
    }), 200


@admin_companies_bp.route('/<int:company_id>', methods=['DELETE'])
@verify_token
@verify_role(UserRole.ADMIN)
@handle_api_errors
def delete_company(company_id):

    delete_company_service(company_id)

    return jsonify({
        "message": "Xóa công ty thành công",
        "company_id": company_id
    }), 200


@admin_companies_bp.route('/<int:company_id>/approve', methods=['PUT'])
@verify_token
@verify_role(UserRole.ADMIN)
@handle_api_errors
def approve_company(company_id):
    company = approve_company_service(company_id)

    emit_company_status_changed(company_id, company['status'], company['approved_at'])
    try:
        notify_company_approved(company_id)
    except Exception as ex:
        print(f"✗ Không tạo được thông báo duyệt công ty {company_id}: {ex}")

    return jsonify({
        "message": "Duyệt công ty thành công",
        "company_id": company_id
    }), 200


@admin_companies_bp.route('/<int:company_id>/reject', methods=['PUT'])
@verify_token
@verify_role(UserRole.ADMIN)
@handle_api_errors
def reject_company(company_id):

    data = request.get_json(silent=True) or {}
    reason = data.get('reason')

    company = reject_company_service(company_id)

    emit_company_status_changed(company_id, company['status'], None)

    try:
        notify_company_rejected(company_id, reason=reason)
    except Exception as ex:
        print(f"✗ Không tạo được thông báo từ chối công ty {company_id}: {ex}")

    return jsonify({
        "message": "Từ chối công ty thành công",
        "company_id": company_id
    }), 200
