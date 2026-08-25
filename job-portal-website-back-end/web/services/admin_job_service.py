from web import dao
from web.models import PostStatus
from web.services.exceptions import ConflictError, NotFoundError, ValidationError
from web.services.validators import (
    parse_enum,
    parse_enum_optional,
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


def update_job_status_service(job_id, status_value):
    status = parse_enum(PostStatus, status_value, "Trạng thái")
    job = _get_job_or_404(job_id)

    if job.status == status:
        raise ConflictError(f'Bài đăng đang ở trạng thái "{status.value}"')

    
    if status == PostStatus.HOAT_DONG and dao.is_job_expired(job.deadline):
        raise ValidationError("Bài đăng đã quá hạn nộp hồ sơ, vui lòng gia hạn trước khi mở lại")

    dao.update_job_status(job, status)

    return dao.get_admin_job_detail(job_id)
