from web import dao
from web.models import UserRole
from web.services.exceptions import ValidationError
from web.services.validators import (
    validate_email_format,
    validate_password_confirmation,
    validate_password_strength,
    validate_required_fields,
    validate_username_format,
)


REGISTERABLE_ROLES = {
    'ungvien': UserRole.UNGVIEN,
    'nhatuyendung': UserRole.NHATUYENDUNG,
}






def check_constraint_of_username(username):
    text = validate_username_format(username)

    if dao.get_user_by_username(text):
        raise ValidationError("Username này đã tồn tại!")

    return text


def check_constraint_of_email(email):
    text = validate_email_format(email)

    if dao.get_user_by_email(text):
        raise ValidationError("Email đã tồn tại!")

    return text


def check_constraint_of_password(password, confirm):
    validate_password_strength(password)
    validate_password_confirmation(password, confirm)

    return True


def parse_register_role(role_value):
    role = REGISTERABLE_ROLES.get(str(role_value or '').strip())

    if not role:
        raise ValidationError("Vai trò không hợp lệ!")

    return role






def register_service(username, email, password, confirm, role):
    validate_required_fields(username=username, email=email, password=password,
                             confirm=confirm, role=role)

    user_role = role if isinstance(role, UserRole) else parse_register_role(role)
    clean_username = check_constraint_of_username(username)
    clean_email = check_constraint_of_email(email)
    check_constraint_of_password(password, confirm)

    
    return dao.add_user_with_profile(
        username=clean_username,
        email=clean_email,
        password=password,
        role=user_role
    )


def login_service(username, password):
    validate_required_fields(username=username, password=password)

    user = dao.auth_user(username=username, password=password)

    if not user:
        raise ValidationError("Sai tên đăng nhập hoặc mật khẩu!")

    return user
