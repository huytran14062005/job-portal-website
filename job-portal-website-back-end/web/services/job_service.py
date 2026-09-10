from web import dao
from web.models import CompanyStatus, JobPost, PostStatus
from web.services.exceptions import NotFoundError, ValidationError
from web.services.validators import Limits


def toggle_save_job_service(user_id, job_post_id):
    
    job_post = JobPost.query.get(job_post_id)
    if not job_post:
        raise NotFoundError("Job không tồn tại")

    is_saved = dao.check_job_saved(user_id, job_post_id)

    
    if is_saved:
        dao.unsave_job(user_id, job_post_id)
        return {"is_saved": False, "message": "Đã bỏ lưu job"}

    
    if job_post.status != PostStatus.HOAT_DONG:
        raise ValidationError("Bài đăng này không còn hoạt động")

    
    if not job_post.company or job_post.company.status != CompanyStatus.DA_DUYET:
        raise ValidationError("Bài đăng này không còn hoạt động")

    
    if dao.is_job_expired(job_post.deadline, job_post.status):
        raise ValidationError("Bài đăng này đã hết hạn, không thể lưu tin")

    dao.save_job(user_id, job_post_id)
    return {"is_saved": True, "message": "Đã lưu job thành công"}


def get_saved_job_statuses_service(user_id, raw_job_ids):
    text = str(raw_job_ids or '').strip()

    
    if not text:
        return []

    try:
        parsed = list(dict.fromkeys(
            int(part.strip()) for part in text.split(',') if part.strip()
        ))
    except ValueError:
        raise ValidationError("job_ids phải là danh sách ID hợp lệ")

    if not parsed or any(job_id <= 0 for job_id in parsed):
        raise ValidationError("job_ids phải là danh sách ID hợp lệ")

    if len(parsed) > Limits.SAVED_STATUS_BATCH_MAX:
        raise ValidationError(
            f"job_ids chỉ được tối đa {Limits.SAVED_STATUS_BATCH_MAX} phần tử mỗi lần"
        )

    return dao.get_saved_job_ids(user_id, parsed)


def get_job_detail_service(job_id):
    job = dao.get_job_detail(job_id)

    if not job:
        raise NotFoundError("Job không tồn tại")

    return job
