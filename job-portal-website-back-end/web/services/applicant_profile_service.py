from web import dao
from web.models import Gender, UserRole
from web.services.exceptions import AppError, NotFoundError, ValidationError
from web.services.validators import (
    Limits,
    optional_birth_date,
    optional_text,
    validate_image_upload,
    validate_phone,
)


def parse_gender(gender_value):
    text = str(gender_value or '').strip().lower()

    if not text:
        return Gender.KHAC

    for member in Gender:
        if member.value == text:
            return member

    allowed = ', '.join(member.value for member in Gender)
    raise ValidationError(f"Giới tính không hợp lệ. Chỉ chấp nhận: {allowed}")


def get_profile_service(user_id):
    user = dao.get_user_by_id(user_id)

    if not user:
        raise NotFoundError("User không tồn tại")

    
    
    
    if user.role != UserRole.UNGVIEN:
        return user, dao.build_applicant_profile(user_id)

    
    return user, dao.ensure_applicant_profile(user_id)


def replace_avatar_service(profile, avatar_file):
    from web.services.cloudinary_service import replace_cloudinary_image

    if not avatar_file or not avatar_file.filename:
        return profile.avatar_url

    
    validate_image_upload(avatar_file, "Ảnh đại diện")

    success, new_avatar_url, error = replace_cloudinary_image(
        old_url=profile.avatar_url,
        new_file=avatar_file
    )

    if not success:
        raise AppError(error or "Upload avatar thất bại", status_code=500)

    profile.avatar_url = new_avatar_url

    return new_avatar_url


def update_profile_service(user_id, full_name, gender, date_of_birth, phone, address, description,
                           profile=None):
    
    if profile is None:
        profile = dao.get_applicant_profile(user_id)

    if not profile:
        raise NotFoundError("Profile không tồn tại")

    dao.update_profile(
        profile=profile,
        full_name=optional_text(full_name, "Họ tên", Limits.FULL_NAME_MAX),   
        gender=parse_gender(gender),                                          
        date_of_birth=optional_birth_date(date_of_birth, "Ngày sinh"),        
        phone=validate_phone(phone),                                          
        address=optional_text(address, "Địa chỉ"),                            
        description=optional_text(description, "Mô tả bản thân")              
    )

    return True
