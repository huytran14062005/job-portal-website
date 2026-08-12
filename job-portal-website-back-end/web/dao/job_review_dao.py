from datetime import datetime

from sqlalchemy import func

from web import db
from web.models import JobReview, ApplicantInfo, Application, ApplicationStatus


def has_approved_application(candidate_id, job_post_id):
    application = Application.query.filter(
        Application.candidate_id == candidate_id,
        Application.job_post_id == job_post_id,
        Application.status == ApplicationStatus.DA_DUYET
    ).first()

    return application is not None


def create_review(candidate_id, job_post_id, rating, comment=None):
    review = JobReview(
        candidate_id=candidate_id,
        job_post_id=job_post_id,
        rating=rating,
        comment=comment
    )

    db.session.add(review)

    try:
        db.session.commit()
        return review
    except Exception as ex:
        db.session.rollback()
        raise Exception(f'Lỗi khi tạo đánh giá: {str(ex)}')


def get_review_by_candidate_and_job(candidate_id, job_post_id):
    return JobReview.query.filter(
        JobReview.candidate_id == candidate_id,
        JobReview.job_post_id == job_post_id
    ).first()


def get_review_by_id_for_candidate(review_id, candidate_id):
    return JobReview.query.filter(
        JobReview.id == review_id,
        JobReview.candidate_id == candidate_id
    ).first()


def get_reviews_by_job(job_post_id, page=1, limit=10):
    query = (db.session.query(
        JobReview.id,
        JobReview.rating,
        JobReview.comment,
        JobReview.created_at,
        JobReview.updated_at,
        JobReview.candidate_id,
        ApplicantInfo.full_name.label('candidate_name'),
        ApplicantInfo.avatar_url.label('candidate_avatar')
    )
             .join(ApplicantInfo, JobReview.candidate_id == ApplicantInfo.id)
             .filter(JobReview.job_post_id == job_post_id)
             .order_by(JobReview.created_at.desc()))



    review_count = (
        db.session.query(func.count(JobReview.id))
        .join(ApplicantInfo, JobReview.candidate_id == ApplicantInfo.id)
        .filter(JobReview.job_post_id == job_post_id)
        .scalar_subquery()
    )
    average_rating = (
        db.session.query(func.avg(JobReview.rating))
        .filter(JobReview.job_post_id == job_post_id)
        .scalar_subquery()
    )
    stats = db.session.query(
        review_count.label('total'),
        average_rating.label('avg_rating')
    ).one()
    total = stats.total or 0


    offset = (page - 1) * limit
    reviews = query.offset(offset).limit(limit).all()

    avg_rating = stats.avg_rating or 0


    reviews_list = [{
        'id': r.id,
        'rating': r.rating,
        'comment': r.comment,
        'created_at': r.created_at.isoformat() if r.created_at else None,
        'updated_at': r.updated_at.isoformat() if r.updated_at else None,
        'candidate_id': r.candidate_id,
        'candidate_name': r.candidate_name,
        'candidate_avatar': r.candidate_avatar
    } for r in reviews]

    return reviews_list, total, round(float(avg_rating), 2), total


def update_review(review, rating=None, comment=None):
    if rating is not None:
        review.rating = rating

    if comment is not None:
        review.comment = comment

    review.updated_at = datetime.now()

    try:
        db.session.commit()
        return review
    except Exception as ex:
        db.session.rollback()
        raise Exception(f'Lỗi khi cập nhật đánh giá: {str(ex)}')


def delete_review(review):
    try:
        db.session.delete(review)
        db.session.commit()
        return True
    except Exception as ex:
        db.session.rollback()
        raise Exception(f'Lỗi khi xóa đánh giá: {str(ex)}')


def get_job_rating_summary(job_post_id):
    result = db.session.query(
        func.avg(JobReview.rating).label('avg_rating'),
        func.count(JobReview.id).label('total_reviews')
    ).filter(JobReview.job_post_id == job_post_id).first()

    return {
        'avg_rating': round(float(result.avg_rating), 2) if result.avg_rating else 0,
        'total_reviews': result.total_reviews
    }
