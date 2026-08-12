from web import dao
from web.dao import job_review_dao
from web.models import CompanyStatus, JobPost, PostStatus
from web.services.exceptions import NotFoundError, ValidationError
from web.services.validators import Limits, optional_rating, require_rating, require_text


def _get_reviewable_job(job_post_id, action_label):
    job = JobPost.query.get(job_post_id)

    if not job:
        raise NotFoundError("Công việc không tồn tại")

    if job.status != PostStatus.HOAT_DONG:
        raise ValidationError(f"Không thể {action_label} cho công việc đã đóng hoặc bị ẩn")

    if not job.company or job.company.status != CompanyStatus.APPROVED:
        raise ValidationError(f"Không thể {action_label} cho công việc đã đóng hoặc bị ẩn")

    if dao.is_job_expired(job.deadline, job.status):
        raise ValidationError(f"Không thể {action_label} vì bài đăng đã hết hạn")

    return job


def _require_approved_application(candidate_id, job_post_id, message):
    if not job_review_dao.has_approved_application(candidate_id, job_post_id):
        raise ValidationError(message)


def create_review_service(candidate_id, job_post_id, rating, comment=None):
    _get_reviewable_job(job_post_id, "đánh giá")

    _require_approved_application(
        candidate_id, job_post_id,
        "Bạn không thể đánh giá vì chưa ứng tuyển thành công"
    )

    
    if job_review_dao.get_review_by_candidate_and_job(candidate_id, job_post_id):
        raise ValidationError(
            "Bạn đã đánh giá công việc này rồi. Vui lòng chỉnh sửa đánh giá của bạn."
        )

    
    clean_rating = require_rating(rating)
    clean_comment = require_text(comment, "Nội dung đánh giá", Limits.REVIEW_COMMENT_MAX)

    return job_review_dao.create_review(
        candidate_id=candidate_id,
        job_post_id=job_post_id,
        rating=clean_rating,
        comment=clean_comment
    )


def update_review_service(review_id, candidate_id, rating=None, comment=None):
    
    review = job_review_dao.get_review_by_id_for_candidate(review_id, candidate_id)
    if not review:
        raise NotFoundError("Đánh giá không tồn tại hoặc bạn không có quyền chỉnh sửa")

    
    _get_reviewable_job(review.job_post_id, "chỉnh sửa đánh giá")
    _require_approved_application(
        candidate_id, review.job_post_id,
        "Không thể chỉnh sửa đánh giá khi đơn ứng tuyển không còn ở trạng thái đã duyệt"
    )

    
    clean_rating = optional_rating(rating)

    
    clean_comment = None
    if comment is not None:
        clean_comment = require_text(comment, "Nội dung đánh giá", Limits.REVIEW_COMMENT_MAX)

    return job_review_dao.update_review(review, rating=clean_rating, comment=clean_comment)


def delete_review_service(review_id, candidate_id):
    review = job_review_dao.get_review_by_id_for_candidate(review_id, candidate_id)

    if not review:
        raise NotFoundError("Đánh giá không tồn tại hoặc bạn không có quyền xóa")

    return job_review_dao.delete_review(review)


def get_reviews_service(job_post_id, page=1, limit=10):
    return job_review_dao.get_reviews_by_job(job_post_id=job_post_id, page=page, limit=limit)


def get_rating_summary_service(job_post_id):
    return job_review_dao.get_job_rating_summary(job_post_id)
