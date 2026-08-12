from datetime import datetime

from sqlalchemy import or_
from sqlalchemy.orm import joinedload

from web import db
from web.models import CompanyInfo, User, CompanyStatus
from .base_dao import apply_pagination
from .job_dao import hide_job_posts_of_company


def get_all_companies(page=1, per_page=None, status=None, keyword=None):
    query = CompanyInfo.query.options(joinedload(CompanyInfo.user))


    if status:
        query = query.filter(CompanyInfo.status == status)


    if keyword:
        kw = f"%{keyword.strip()}%"
        query = query.join(User, User.id == CompanyInfo.id).filter(
            or_(
                CompanyInfo.company_name.ilike(kw),
                CompanyInfo.industry.ilike(kw),
                User.username.ilike(kw),
                User.email.ilike(kw)
            )
        )

    query = query.order_by(CompanyInfo.id.desc())


    query, total = apply_pagination(query, page, page_size=per_page)

    companies = query.all()

    return companies, total


def get_company_info_by_id(company_id):
    return CompanyInfo.query.get(company_id)


def get_company_detail_by_id(company_id):
    company = (
        CompanyInfo.query
        .options(joinedload(CompanyInfo.user))
        .filter(CompanyInfo.id == company_id)
        .first()
    )

    if not company:
        return None

    user = company.user

    result = {
        'id': company.id,
        'company_name': company.company_name,
        'logo_url': company.logo_url,
        'industry': company.industry,
        'company_size': company.company_size,
        'website': company.website,
        'description': company.description,
        'address': company.address,
        'status': company.status.value if company.status else None,
        'approved_at': company.approved_at.isoformat() if company.approved_at else None,
        'user_info': None
    }

    if user:
        result['user_info'] = {
            'username': user.username,
            'email': user.email,
            'created_at': user.created_at.isoformat() if user.created_at else None
        }

    return result


def update_company(company, changes):
    for field, value in changes.items():
        setattr(company, field, value)

    try:
        db.session.commit()
    except Exception as ex:
        db.session.rollback()
        raise Exception(f'Lỗi cập nhật công ty: {str(ex)}')

    return True


def delete_company(user):
    try:
        db.session.delete(user)
        db.session.commit()
    except Exception as ex:
        db.session.rollback()
        raise Exception(f'Lỗi xóa công ty: {str(ex)}')

    return True


def get_pending_companies(page=1, per_page=None):
    query = (
        CompanyInfo.query
        .options(joinedload(CompanyInfo.user))
        .filter(CompanyInfo.status == CompanyStatus.PENDING)
        .order_by(CompanyInfo.id.desc())
    )


    query, total = apply_pagination(query, page, page_size=per_page)

    companies = query.all()

    return companies, total


def set_company_status(company, status, approved_at=None):
    company.status = status
    company.approved_at = approved_at

    try:
        db.session.commit()
    except Exception as ex:
        db.session.rollback()
        raise Exception(f'Lỗi cập nhật trạng thái công ty: {str(ex)}')

    return True


def approve_company(company):
    return set_company_status(company, CompanyStatus.APPROVED, approved_at=datetime.now())


def reject_company(company):
    company.status = CompanyStatus.REJECT
    company.approved_at = None

    hidden_count = hide_job_posts_of_company(company.id)

    try:
        db.session.commit()
    except Exception as ex:
        db.session.rollback()
        raise Exception(f'Lỗi cập nhật trạng thái công ty: {str(ex)}')

    return hidden_count
