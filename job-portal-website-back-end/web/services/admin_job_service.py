from web import dao
from web.models import PostStatus
from web.services.exceptions import ConflictError, NotFoundError, ValidationError
from web.services.validators import (
    Limits,
    optional_non_negative_int,
    optional_text,
    parse_enum,
    parse_enum_optional,
    require_date,
    require_int,
    require_text,
    validate_salary_range,
)


def parse_post_status_filter(status_value):
    return parse_enum_optional(PostStatus, status_value)


def _get_job_or_404(job_id):
    job = dao.get_job_by_id(job_id)

    if not job:
        raise NotFoundError("Bài đăng không tồn tại")

    return job


def get_job_detail_service(job_id):
    detail = dao.get_admin_job_detail(job_id)

    if not detail:
        raise NotFoundError("Bài đăng không tồn tại")

    return detail


def update_job_service(job_id, data):
    job = _get_job_or_404(job_id)

    changes = {}

    if data.get('title') is not None:
        changes['title'] = require_text(data['title'], "Tiêu đề công việc", Limits.JOB_TITLE_MAX)

    if data.get('description') is not None:
        changes['description'] = require_text(data['description'], "Mô tả công việc")

    if data.get('requirements') is not None:
        changes['requirements'] = optional_text(data['requirements'], "Yêu cầu ứng viên")

    if data.get('benefits') is not None:
        changes['benefits'] = optional_text(data['benefits'], "Quyền lợi ứng viên")

    
    if data.get('min_salary') is not None:
        changes['min_salary'] = optional_non_negative_int(data['min_salary'], "Lương tối thiểu")

    if data.get('max_salary') is not None:
        changes['max_salary'] = optional_non_negative_int(data['max_salary'], "Lương tối đa")

    
    validate_salary_range(
        changes.get('min_salary', job.min_salary),
        changes.get('max_salary', job.max_salary)
    )

    if data.get('deadline') is not None:
        changes['deadline'] = require_date(data['deadline'], "Hạn nộp hồ sơ")

    if data.get('location_id') is not None:
        location_id = require_int(data['location_id'], "Địa điểm")
        if not dao.get_location_by_id(location_id):
            raise ValidationError("Địa điểm không hợp lệ")
        changes['location_id'] = location_id

    if data.get('job_type_id') is not None:
        job_type_id = require_int(data['job_type_id'], "Loại công việc")
        if not dao.get_job_type_by_id(job_type_id):
            raise ValidationError("Loại công việc không hợp lệ")
        changes['job_type_id'] = job_type_id

    
    if (job.status == PostStatus.HET_HAN
            and 'deadline' in changes
            and not dao.is_job_expired(changes['deadline'])):
        changes['status'] = PostStatus.HOAT_DONG

    if changes:
        dao.update_job(job, changes)

    return dao.get_admin_job_detail(job_id)


def update_job_status_service(job_id, status_value):
    status = parse_enum(PostStatus, status_value, "Trạng thái")
    job = _get_job_or_404(job_id)

    if job.status == status:
        raise ConflictError(f'Bài đăng đang ở trạng thái "{status.value}"')

    
    if status == PostStatus.HOAT_DONG and dao.is_job_expired(job.deadline):
        raise ValidationError("Bài đăng đã quá hạn nộp hồ sơ, vui lòng gia hạn trước khi mở lại")

    dao.update_job_status(job, status)

    return dao.get_admin_job_detail(job_id)


def delete_job_service(job_id):
    job = _get_job_or_404(job_id)

    return dao.delete_job(job)
