from web import dao
from web.models import UserRole
from web.services.exceptions import NotFoundError
from web.services.validators import parse_page

VALID_FOLLOW_FILTERS = ('followed', 'not_followed')


def parse_follow_filter(follow_filter):
    text = str(follow_filter or '').strip()

    return text if text in VALID_FOLLOW_FILTERS else None


def resolve_candidate_id(user_id, user_role):
    if user_id is None or user_role is None:
        return None

    role_value = user_role.value if hasattr(user_role, 'value') else str(user_role)

    return user_id if role_value == UserRole.UNGVIEN.value else None


def get_companies_service(page_value, keyword, industry, user_id=None, user_role=None,
                          follow_filter=None):
    page = parse_page(page_value)
    candidate_id = resolve_candidate_id(user_id, user_role)

    companies, total = dao.get_companies_with_active_jobs(
        page=page,
        keyword=str(keyword or '').strip() or None,
        industry=str(industry or '').strip() or None,
        candidate_id=candidate_id,
        follow_filter=parse_follow_filter(follow_filter) if candidate_id else None
    )

    return companies, total, page


def get_company_detail_service(company_id):
    company = dao.get_company_by_id(company_id)

    if not company:
        raise NotFoundError("Công ty không tồn tại")

    return company
