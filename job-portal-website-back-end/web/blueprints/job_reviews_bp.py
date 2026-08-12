import math

from flask import Blueprint, jsonify, request

from web.blueprints.api_errors import handle_api_errors
from web.middleware.auth_middleware import verify_role, verify_token
from web.models import UserRole
from web.services.job_review_service import (
    create_review_service,
    delete_review_service,
    get_rating_summary_service,
    get_reviews_service,
    update_review_service,
)

job_reviews_bp = Blueprint('job_reviews', __name__, url_prefix='/api/jobs')


@job_reviews_bp.route('/<int:job_id>/reviews', methods=['GET'])
@handle_api_errors
def get_job_reviews(job_id):
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 10))

    reviews, total, avg_rating, total_reviews = get_reviews_service(
        job_post_id=job_id, page=page, limit=limit
    )

    return jsonify({
        'reviews': reviews,
        'total': total,
        'page': page,
        'limit': limit,
        'total_pages': math.ceil(total / limit) if limit > 0 else 1,
        'avg_rating': avg_rating,
        'total_reviews': total_reviews
    }), 200


@job_reviews_bp.route('/<int:job_id>/reviews', methods=['POST'])
@verify_token
@verify_role(UserRole.UNGVIEN)
@handle_api_errors
def create_job_review(job_id):
    data = request.get_json(silent=True) or {}

    review = create_review_service(
        candidate_id=request.user_id,
        job_post_id=job_id,
        rating=data.get('rating'),
        comment=data.get('comment')
    )

    return jsonify({
        "message": "Đánh giá thành công!",
        "review": {
            "id": review.id,
            "rating": review.rating,
            "comment": review.comment,
            "created_at": review.created_at.isoformat() if review.created_at else None
        }
    }), 201


@job_reviews_bp.route('/<int:job_id>/reviews/<int:review_id>', methods=['PUT'])
@verify_token
@verify_role(UserRole.UNGVIEN)
@handle_api_errors
def update_job_review(job_id, review_id):
    data = request.get_json(silent=True) or {}


    review = update_review_service(
        review_id=review_id,
        candidate_id=request.user_id,
        rating=data.get('rating'),
        comment=data.get('comment')
    )

    return jsonify({
        "message": "Cập nhật đánh giá thành công!",
        "review": {
            "id": review.id,
            "rating": review.rating,
            "comment": review.comment,
            "updated_at": review.updated_at.isoformat() if review.updated_at else None
        }
    }), 200


@job_reviews_bp.route('/<int:job_id>/reviews/<int:review_id>', methods=['DELETE'])
@verify_token
@verify_role(UserRole.UNGVIEN)
@handle_api_errors
def delete_job_review(job_id, review_id):
    delete_review_service(review_id=review_id, candidate_id=request.user_id)

    return jsonify({"message": "Xóa đánh giá thành công!"}), 200


@job_reviews_bp.route('/<int:job_id>/rating-summary', methods=['GET'])
@handle_api_errors
def get_job_rating_summary(job_id):
    return jsonify(get_rating_summary_service(job_id)), 200
