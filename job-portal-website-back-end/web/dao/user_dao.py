from web import db
from web.models import User, UserRole
from web.utils.password_hasher import hash_password, verify_password
from .profile_dao import build_applicant_profile, build_company_profile


def get_user_by_id(user_id):
    return User.query.get(user_id)


def get_user_by_username(username):
    return User.query.filter(User.username == username.strip()).first()


def get_user_by_email(email):
    return User.query.filter(User.email == email.strip()).first()


def get_user_by_email_insensitive(email):
    return User.query.filter(db.func.lower(User.email) == email.strip().lower()).first()


def auth_user(username, password):
    user = User.query.filter(User.username == username.strip()).first()

    if user and verify_password(password, user.password_hash):
        return user

    return None


def add_user_with_profile(username, email, password, role):
    user = User(
        username=username,
        email=email,
        password_hash=hash_password(password),
        role=role
    )

    if role == UserRole.UNGVIEN:
        user.applicant_info = build_applicant_profile()
    elif role == UserRole.NHATUYENDUNG:
        user.company_info = build_company_profile()

    db.session.add(user)

    try:
        db.session.commit()
        return user
    except Exception as ex:
        db.session.rollback()
        raise Exception(f'Lỗi hệ thống: {str(ex)}!')


def update_user_password(user, new_password):
    user.password_hash = hash_password(new_password)

    try:
        db.session.commit()
        return user
    except Exception as ex:
        db.session.rollback()
        raise Exception(f'Lỗi khi đổi mật khẩu: {str(ex)}!')
