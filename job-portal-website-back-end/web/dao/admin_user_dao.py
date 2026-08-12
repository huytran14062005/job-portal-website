from sqlalchemy import or_
from sqlalchemy.orm import joinedload
from web.models import User, UserRole
from web import db
from .base_dao import apply_pagination


def get_all_users(page=1, per_page=None, role=None, keyword=None):

    query = User.query.filter(User.role != UserRole.ADMIN)


    if role:
        query = query.filter(User.role == role)


    if keyword:
        kw = f"%{keyword.strip()}%"
        query = query.filter(or_(User.username.ilike(kw), User.email.ilike(kw)))

    query = query.order_by(User.created_at.desc())


    query, total = apply_pagination(query, page, page_size=per_page)

    users = query.all()

    return users, total


def get_user_detail_by_id(user_id):
    user = (
        User.query
        .options(
            joinedload(User.applicant_info),
            joinedload(User.company_info)
        )
        .filter(User.id == user_id)
        .first()
    )

    if not user or user.role == UserRole.ADMIN:
        return None

    result = {
        'id': user.id,
        'username': user.username,
        'role': user.role.value,
        'email': user.email,
        'created_at': user.created_at.isoformat() if user.created_at else None,
        'phone': None,
        'date_of_birth': None,
        'address': None,
        'description': None
    }


    if user.role == UserRole.UNGVIEN:
        profile = user.applicant_info
        if profile:
            result['full_name'] = profile.full_name
            result['gender'] = profile.gender.value if profile.gender else None
            result['avatar_url'] = profile.avatar_url
            result['phone'] = profile.phone
            result['date_of_birth'] = profile.date_of_birth.isoformat() if profile.date_of_birth else None
            result['address'] = profile.address
            result['description'] = profile.description

    elif user.role == UserRole.NHATUYENDUNG:
        profile = user.company_info
        if profile:
            result['company_name'] = profile.company_name
            result['industry'] = profile.industry
            result['company_size'] = profile.company_size
            result['website'] = profile.website
            result['logo_url'] = profile.logo_url
            result['status'] = profile.status.value if profile.status else None
            result['phone'] = None
            result['date_of_birth'] = None
            result['address'] = profile.address
            result['description'] = profile.description

    return result


def delete_user(user):
    try:

        db.session.delete(user)
        db.session.commit()
    except Exception as ex:
        db.session.rollback()
        raise Exception(f'Lỗi xóa user: {str(ex)}')

    return True
