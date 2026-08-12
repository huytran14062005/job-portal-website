from web import app, dao
from web.models import ApplicantInfo, CompanyInfo, User, UserRole
from web.services.applicant_profile_service import update_profile_service
from web.services.company_profile_service import update_company_profile_service
from web.services.exceptions import (
    NotFoundError,
    PermissionDeniedError,
    ValidationError,
)
from web.services.validators import parse_page, parse_per_page
from web.utils.date_parser import parse_and_format_date


def parse_paging_args(page_value, per_page_value):
    default_size = app.config.get("APPLICATION_SIZE", 10)

    return parse_page(page_value), parse_per_page(per_page_value, default_size)


def parse_user_role_filter(role_value):
    text = str(role_value or '').strip()

    if text == UserRole.UNGVIEN.value:
        return UserRole.UNGVIEN

    if text == UserRole.NHATUYENDUNG.value:
        return UserRole.NHATUYENDUNG

    return None


def _get_manageable_user(user_id):
    user = User.query.get(user_id)

    if not user or user.role == UserRole.ADMIN:
        raise NotFoundError("User không tồn tại")

    return user


def get_users_list_service(page_value, per_page_value, role_value, keyword):
    page, per_page = parse_paging_args(page_value, per_page_value)
    keyword = str(keyword or '').strip()

    users, total = dao.get_all_users(
        page=page,
        per_page=per_page,
        role=parse_user_role_filter(role_value),
        keyword=keyword or None
    )

    return users, total, page, per_page


def get_user_detail_service(user_id):
    detail = dao.get_user_detail_by_id(user_id)

    if not detail:
        raise NotFoundError("User không tồn tại hoặc không có quyền xem")

    return detail


def delete_user_service(user_id, actor_id):
    actor = User.query.get(actor_id)

    if not actor or actor.role != UserRole.ADMIN:
        raise PermissionDeniedError("Không có quyền xóa người dùng")

    user = User.query.get(user_id)

    if not user:
        raise NotFoundError("User không tồn tại")

    if user.id == actor.id:
        raise PermissionDeniedError("Không thể tự xóa tài khoản của chính mình")

    if user.role == UserRole.ADMIN:
        raise PermissionDeniedError("Không thể xóa tài khoản admin")

    return dao.delete_user(user)


def update_user_profile_service(user_id, data):
    user = _get_manageable_user(user_id)

    if user.role == UserRole.UNGVIEN:
        profile = ApplicantInfo.query.get(user_id)
        if not profile:
            raise NotFoundError("Profile không tồn tại")

        update_profile_service(
            user_id=user_id,
            full_name=data.get('full_name', profile.full_name),
            gender=data.get('gender', profile.gender.value if profile.gender else None),
            date_of_birth=parse_and_format_date(
                data.get('date_of_birth', profile.date_of_birth)
            ),
            phone=data.get('phone', profile.phone),
            address=data.get('address', profile.address),
            description=data.get('description', profile.description),
            profile=profile
        )

    elif user.role == UserRole.NHATUYENDUNG:
        profile = CompanyInfo.query.get(user_id)
        if not profile:
            raise NotFoundError("Profile không tồn tại")

        update_company_profile_service(
            user_id=user_id,
            company_name=data.get('company_name', profile.company_name),
            industry=data.get('industry', profile.industry),
            company_size=data.get('company_size', profile.company_size),
            website=data.get('website', profile.website),
            address=data.get('address', profile.address),
            description=data.get('description', profile.description),
            company_profile=profile
        )

    else:
        raise ValidationError("Vai trò người dùng không hợp lệ")

    return dao.get_user_detail_by_id(user_id)
