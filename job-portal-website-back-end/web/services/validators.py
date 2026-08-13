import re

from web.services.exceptions import ValidationError
from web.utils.date_parser import parse_date_flexible






class Limits:

    
    USERNAME_MAX = 50
    EMAIL_MAX = 100
    PASSWORD_MIN = 8
    PASSWORD_MAX_BYTES = 72
    PHONE_MIN = 10
    PHONE_MAX = 11

    
    FULL_NAME_MAX = 100
    AGE_MIN = 15
    AGE_MAX = 100

    
    COMPANY_NAME_MAX = 255
    INDUSTRY_MAX = 100
    WEBSITE_MAX = 255

    
    JOB_TITLE_MAX = 255

    
    CV_NAME_MAX = 255
    CV_ALLOWED_EXTENSIONS = ('pdf', 'doc', 'docx')
    CV_MAX_SIZE_MB = 5
    CV_MAX_SIZE_BYTES = CV_MAX_SIZE_MB * 1024 * 1024

    
    IMAGE_ALLOWED_EXTENSIONS = ('jpg', 'jpeg', 'png', 'gif', 'webp')
    IMAGE_MAX_SIZE_MB = 5
    IMAGE_MAX_SIZE_BYTES = IMAGE_MAX_SIZE_MB * 1024 * 1024

    
    RATING_MIN = 1
    RATING_MAX = 5
    REVIEW_COMMENT_MAX = 1000

    
    OTP_LENGTH = 6

    
    PER_PAGE_MAX = 100

    
    SAVED_STATUS_BATCH_MAX = 100


EMAIL_PATTERN = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'






def require_text(value, label, max_length=None):
    text = '' if value is None else str(value).strip()

    if not text:
        raise ValidationError(f"{label} không được để trống")

    if max_length and len(text) > max_length:
        raise ValidationError(f"{label} không được quá {max_length} ký tự")

    return text


def optional_text(value, label, max_length=None, default=''):
    if value is None:
        return default

    text = str(value).strip()

    if not text:
        return default

    if max_length and len(text) > max_length:
        raise ValidationError(f"{label} không được quá {max_length} ký tự")

    return text


def validate_required_fields(**fields):
    for field_name, value in fields.items():
        if value is None or (isinstance(value, str) and not value.strip()):
            raise ValidationError(f"{field_name} không được để trống!")

    return True






def require_int(value, label):
    if value is None or (isinstance(value, str) and not value.strip()):
        raise ValidationError(f"{label} không được để trống")

    try:
        return int(value)
    except (TypeError, ValueError):
        raise ValidationError(f"{label} phải là số")


def optional_int(value, label):
    if value is None or (isinstance(value, str) and not value.strip()):
        return None

    try:
        return int(value)
    except (TypeError, ValueError):
        raise ValidationError(f"{label} phải là số")


def optional_non_negative_int(value, label):
    number = optional_int(value, label)

    if number is not None and number < 0:
        raise ValidationError(f"{label} phải là số dương")

    return number






def _parse_date(value, label):
    try:
        return parse_date_flexible(
            value,
            error_message=f"{label} sai định dạng (DD-MM-YYYY hoặc YYYY-MM-DD)"
        )
    except ValidationError:
        raise
    except ValueError as ex:
        raise ValidationError(str(ex))


def require_date(value, label):
    if value is None or (isinstance(value, str) and not value.strip()):
        raise ValidationError(f"{label} không được để trống")

    parsed = _parse_date(value, label)

    if parsed is None:
        raise ValidationError(f"{label} không được để trống")

    return parsed


def optional_date(value, label):
    if value is None or (isinstance(value, str) and not value.strip()):
        return None

    return _parse_date(value, label)


def require_future_date(value, label):
    from datetime import date

    parsed = require_date(value, label)

    if parsed <= date.today():
        raise ValidationError(f"{label} phải sau ngày hiện tại")

    return parsed


def optional_birth_date(value, label):
    from datetime import date

    parsed = optional_date(value, label)

    if parsed is None:
        return None

    today = date.today()

    if parsed >= today:
        raise ValidationError(f"{label} phải trước ngày hiện tại")

    
    age = today.year - parsed.year - ((today.month, today.day) < (parsed.month, parsed.day))

    if age < Limits.AGE_MIN:
        raise ValidationError(f"{label} không hợp lệ: phải đủ {Limits.AGE_MIN} tuổi trở lên")

    if age > Limits.AGE_MAX:
        raise ValidationError(f"{label} không hợp lệ: tuổi không được quá {Limits.AGE_MAX}")

    return parsed


def require_date_range(from_date, to_date):
    if from_date and to_date and from_date > to_date:
        raise ValidationError("Ngày bắt đầu không được sau ngày kết thúc")

    return from_date, to_date






def parse_enum(enum_class, raw_value, label):
    text = '' if raw_value is None else str(raw_value).strip()

    if not text:
        raise ValidationError(f"{label} không được để trống")

    for member in enum_class:
        if member.value == text:
            return member

    allowed = ', '.join(member.value for member in enum_class)
    raise ValidationError(f"{label} không hợp lệ. Chỉ chấp nhận: {allowed}")


def parse_enum_optional(enum_class, raw_value):
    text = '' if raw_value is None else str(raw_value).strip()

    if not text:
        return None

    for member in enum_class:
        if member.value == text:
            return member

    return None


def require_id_list(values, label, max_items=None):
    if not isinstance(values, (list, tuple, set)) or not values:
        raise ValidationError(f"{label} không được để trống")

    ids = []
    for raw in values:
        try:
            number = int(raw)
        except (TypeError, ValueError):
            raise ValidationError(f"{label} phải là danh sách ID hợp lệ")

        if number <= 0:
            raise ValidationError(f"{label} phải là danh sách ID hợp lệ")

        if number not in ids:
            ids.append(number)

    if max_items and len(ids) > max_items:
        raise ValidationError(f"{label} chỉ được tối đa {max_items} phần tử mỗi lần")

    return ids






def validate_username_format(username):
    return require_text(username, "Username", Limits.USERNAME_MAX)


def validate_email_format(email):
    text = require_text(email, "Email", Limits.EMAIL_MAX)

    if not re.match(EMAIL_PATTERN, text):
        raise ValidationError("Email không đúng định dạng!")

    return text


def validate_password_strength(password):
    text = '' if password is None else str(password)

    if not text:
        raise ValidationError("Password không được để trống!")

    if len(text) < Limits.PASSWORD_MIN:
        raise ValidationError(f"Password phải có ít nhất {Limits.PASSWORD_MIN} ký tự.")

    if len(text.encode('utf-8')) > Limits.PASSWORD_MAX_BYTES:
        raise ValidationError(f"Password must not exceed {Limits.PASSWORD_MAX_BYTES} bytes.")

    if not re.search(r'[A-Z]', text):
        raise ValidationError("Password phải chứa ít nhất một chữ hoa.")

    if not re.search(r'[a-z]', text):
        raise ValidationError("Password phải chứa ít nhất một chữ thường.")

    if not re.search(r'[0-9]', text):
        raise ValidationError("Password phải chứa ít nhất một chữ số.")

    if not re.search(r'[^A-Za-z0-9]', text):
        raise ValidationError("Password phải chứa ít nhất một ký tự đặc biệt.")

    return text


def validate_password_confirmation(password, confirm):
    if password != confirm:
        raise ValidationError("Mật khẩu xác nhận không khớp.")

    return True


def require_otp_code(otp):
    text = str(otp or '').strip()

    if not text:
        raise ValidationError("Vui lòng nhập mã OTP.")

    if not text.isdigit() or len(text) != Limits.OTP_LENGTH:
        raise ValidationError(f"Mã OTP phải gồm đúng {Limits.OTP_LENGTH} chữ số.")

    return text


def validate_phone(phone):
    if phone is None:
        return ''

    
    text = re.sub(r'[\s-]', '', str(phone).strip())

    if not text:
        return ''

    if not text.isdigit():
        raise ValidationError("Số điện thoại chỉ được chứa số")

    if not (Limits.PHONE_MIN <= len(text) <= Limits.PHONE_MAX):
        raise ValidationError(
            f"Số điện thoại phải có {Limits.PHONE_MIN}-{Limits.PHONE_MAX} số"
        )

    if not text.startswith('0'):
        raise ValidationError("Số điện thoại phải bắt đầu bằng số 0")

    return text






def require_upload_file(file, label):
    if not file or not getattr(file, 'filename', ''):
        raise ValidationError(f"Chưa chọn {label}")

    return file


def validate_file_extension(file, allowed_extensions, label):
    filename = getattr(file, 'filename', '') or ''
    extension = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''

    if extension not in allowed_extensions:
        allowed = ', '.join(ext.upper() for ext in allowed_extensions)
        raise ValidationError(f"Chỉ chấp nhận {label} định dạng {allowed}")

    return extension


def validate_file_size(file, max_bytes, label):
    file.seek(0, 2)
    size = file.tell()
    file.seek(0)

    if size > max_bytes:
        raise ValidationError(f"{label} không được vượt quá {max_bytes // (1024 * 1024)}MB")

    return size


def validate_image_upload(file, label):
    require_upload_file(file, label)
    validate_file_extension(file, Limits.IMAGE_ALLOWED_EXTENSIONS, label)
    validate_file_size(file, Limits.IMAGE_MAX_SIZE_BYTES, label)

    return file






def validate_salary_range(min_salary, max_salary):
    min_value = optional_non_negative_int(min_salary, "Mức lương tối thiểu")
    max_value = optional_non_negative_int(max_salary, "Mức lương tối đa")

    if min_value is not None and max_value is not None and min_value > max_value:
        raise ValidationError("Lương tối thiểu không được lớn hơn lương tối đa")

    return min_value, max_value


def require_rating(rating):
    if rating is None or (isinstance(rating, str) and not rating.strip()):
        raise ValidationError("Rating là bắt buộc")

    if isinstance(rating, bool):
        raise ValidationError(f"Rating phải là số từ {Limits.RATING_MIN} đến {Limits.RATING_MAX}")

    try:
        value = int(rating)
    except (TypeError, ValueError):
        raise ValidationError(f"Rating phải là số từ {Limits.RATING_MIN} đến {Limits.RATING_MAX}")

    if not (Limits.RATING_MIN <= value <= Limits.RATING_MAX):
        raise ValidationError(f"Rating phải là số từ {Limits.RATING_MIN} đến {Limits.RATING_MAX}")

    return value


def optional_rating(rating):
    if rating is None:
        return None

    return require_rating(rating)


def parse_page(value, label="Trang"):
    try:
        page = int(value) if value not in (None, '') else 1
    except (TypeError, ValueError):
        raise ValidationError(f"{label} phải là số")

    return page if page >= 1 else 1


def parse_per_page(value, default, max_value=None):
    max_value = max_value or Limits.PER_PAGE_MAX

    try:
        per_page = int(value) if value not in (None, '') else default
    except (TypeError, ValueError):
        return default

    if per_page < 1 or per_page > max_value:
        return default

    return per_page
