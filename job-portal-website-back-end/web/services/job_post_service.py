from web import dao
from web.models import PostStatus
from web.services.exceptions import NotFoundError, PermissionDeniedError, ValidationError
from web.services.validators import (
    Limits,
    parse_enum,
    require_date,
    require_future_date,
    require_int,
    require_text,
    validate_salary_range,
)






def _validate_location(location_id):
    if location_id is None or location_id == '':
        raise ValidationError("Vui lòng chọn địa điểm")

    location_id = require_int(location_id, "Địa điểm")

    if not dao.get_location_by_id(location_id):
        raise ValidationError("Địa điểm không hợp lệ")

    return location_id


def _validate_job_type(job_type_id):
    if job_type_id is None or job_type_id == '':
        raise ValidationError("Vui lòng chọn loại công việc")

    job_type_id = require_int(job_type_id, "Loại công việc")

    if not dao.get_job_type_by_id(job_type_id):
        raise ValidationError("Loại công việc không hợp lệ")

    return job_type_id


def _validate_job_post_input(data, deadline_must_be_future):
    title = require_text(data.get('title'), "Tiêu đề công việc", Limits.JOB_TITLE_MAX)
    description = require_text(data.get('description'), "Mô tả công việc")
    min_salary, max_salary = validate_salary_range(data.get('min_salary'), data.get('max_salary'))

    if deadline_must_be_future:
        deadline = require_future_date(data.get('deadline'), "Hạn nộp hồ sơ")
    else:
        deadline = require_date(data.get('deadline'), "Hạn nộp hồ sơ")

    return {
        'title': title,
        'description': description,
        'min_salary': min_salary,
        'max_salary': max_salary,
        'deadline': deadline,
        'location_id': _validate_location(data.get('location_id')),
        'job_type_id': _validate_job_type(data.get('job_type_id')),
    }


def _get_own_job_post(job_id, company_id, action="chỉnh sửa"):
    if not company_id:
        raise PermissionDeniedError(f"Bạn không có quyền {action} bài đăng này")

    job_post = dao.get_job_by_id(job_id)

    if not job_post:
        raise NotFoundError("Job post không tồn tại")

    
    if job_post.company_id != company_id:
        raise PermissionDeniedError(f"Bạn không có quyền {action} bài đăng của công ty khác")

    return job_post


def get_own_job_post_service(job_id, company_id):
    return _get_own_job_post(job_id, company_id, action="xem")






def create_job_post_service(company_id, data):
    clean = _validate_job_post_input(data, deadline_must_be_future=True)

    job_post = dao.create_job_post(company_id=company_id, **clean)

    _notify_followers(company_id, job_post)

    return job_post


def update_job_post_service(job_id, company_id, data):
    job_post = _get_own_job_post(job_id, company_id)

    
    merged = {
        'title': data.get('title') or job_post.title,
        'description': data.get('description') or job_post.description,
        'min_salary': data.get('min_salary', job_post.min_salary),
        'max_salary': data.get('max_salary', job_post.max_salary),
        'deadline': data.get('deadline') or job_post.deadline,
        'location_id': data.get('location_id', job_post.location_id),
        'job_type_id': data.get('job_type_id', job_post.job_type_id),
    }

    clean = _validate_job_post_input(merged, deadline_must_be_future=False)

    
    
    reopened_status = None
    if job_post.status == PostStatus.HET_HAN and not dao.is_job_expired(clean['deadline']):
        reopened_status = PostStatus.HOAT_DONG

    return dao.update_job_post(job_post, status=reopened_status, **clean)


def update_job_post_status_service(job_id, company_id, status_value):
    job_post = _get_own_job_post(job_id, company_id)
    status = parse_enum(PostStatus, status_value, "Trạng thái")

    
    if status == PostStatus.HOAT_DONG and dao.is_job_expired(job_post.deadline):
        raise ValidationError("Bài đăng đã quá hạn nộp hồ sơ, vui lòng gia hạn trước khi mở lại")

    return dao.update_job_post_status(job_post, status)


def _notify_followers(company_id, job_post):
    try:
        from web.services.company_follow_service import notify_followers_new_job

        company = dao.get_company_info_by_id(company_id)
        if company:
            notify_followers_new_job(
                company_id=company_id,
                company_name=company.company_name,
                job_id=job_post.id,
                job_title=job_post.title
            )
    except Exception as ex:
        print(f"✗ Error notifying followers: {ex}")
