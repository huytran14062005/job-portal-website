from web import dao
from web.models import CompanyStatus, User, UserRole
from web.services.exceptions import ConflictError, NotFoundError, ValidationError
from web.services.validators import (
    Limits,
    optional_non_negative_int,
    optional_text,
    parse_enum_optional,
    require_text,
)


def parse_company_status_filter(status_value):
    return parse_enum_optional(CompanyStatus, status_value)


def _get_company_or_404(company_id):
    company = dao.get_company_info_by_id(company_id)

    if not company:
        raise NotFoundError("Công ty không tồn tại")

    return company


def get_company_detail_service(company_id):
    detail = dao.get_company_detail_by_id(company_id)

    if not detail:
        raise NotFoundError("Công ty không tồn tại")

    return detail


def update_company_service(company_id, data):
    company = _get_company_or_404(company_id)

    changes = {}

    if 'company_name' in data and data['company_name'] is not None:
        changes['company_name'] = require_text(
            data['company_name'], "Tên công ty", Limits.COMPANY_NAME_MAX
        )

    if 'industry' in data and data['industry'] is not None:
        changes['industry'] = optional_text(data['industry'], "Ngành nghề", Limits.INDUSTRY_MAX)

    if 'company_size' in data and data['company_size'] is not None:
        size = optional_non_negative_int(data['company_size'], "Quy mô công ty")
        changes['company_size'] = size if size is not None else 0

    if 'website' in data and data['website'] is not None:
        changes['website'] = optional_text(data['website'], "Website", Limits.WEBSITE_MAX)

    if 'address' in data and data['address'] is not None:
        changes['address'] = optional_text(data['address'], "Địa chỉ")

    if 'description' in data and data['description'] is not None:
        changes['description'] = optional_text(data['description'], "Mô tả công ty")

    if changes:
        dao.update_company(company, changes)

    return dao.get_company_detail_by_id(company_id)


def delete_company_service(company_id):
    user = User.query.get(company_id)

    if not user:
        raise NotFoundError("Công ty không tồn tại")

    if user.role != UserRole.NHATUYENDUNG:
        raise ValidationError("User này không phải nhà tuyển dụng")

    return dao.delete_company(user)


def approve_company_service(company_id):
    company = _get_company_or_404(company_id)

    if company.status == CompanyStatus.APPROVED:
        raise ConflictError("Công ty đã được duyệt trước đó")

    dao.approve_company(company)

    return dao.get_company_detail_by_id(company_id)


def reject_company_service(company_id):
    company = _get_company_or_404(company_id)

    if company.status == CompanyStatus.REJECT:
        raise ConflictError("Công ty đã bị từ chối trước đó")

    hidden_job_posts = dao.reject_company(company)

    detail = dao.get_company_detail_by_id(company_id)
    detail['hidden_job_posts'] = hidden_job_posts

    return detail
