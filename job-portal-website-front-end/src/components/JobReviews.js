import React, { useState, useEffect, useContext } from "react";
import Apis, { endpoints, authApis } from "../configs/Apis";
import { useToast } from "./Toast";
import { MyUserContext } from "../configs/Contexts";
import MySpinner from "./MySpinner";
import ConfirmModal from "./ConfirmModal";
import moment from "moment";
import "moment/locale/vi"; 
import { renderStars } from "../utils/renderStars";
import { getApiError } from "../utils/apiError";
import {
  getApplicantAvatar,
  onApplicantAvatarError,
} from "../utils/defaultImages";

moment.locale("vi"); 



const JobReviews = ({ jobId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user] = useContext(MyUserContext);
  const toast = useToast();

  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  
  const [editingReviewId, setEditingReviewId] = useState(null);

  
  const [openMenuId, setOpenMenuId] = useState(null);

  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);

  
  const [myReview, setMyReview] = useState(null);

  
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    loadReviews();
  }, [jobId, user]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await Apis.get(endpoints["job-reviews"](jobId));
      setReviews(response.data.reviews);
      setAvgRating(response.data.avg_rating);
      setTotalReviews(response.data.total_reviews);
      
      
      if (user && user.role === "ungvien") {
        const myReviewFromList = response.data.reviews.find(
          review => review.candidate_id === user.id
        );
        setMyReview(myReviewFromList || null);
      }
    } catch (err) {
      console.error("Error loading reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    
    
    
    setSubmitting(true);

    try {
      const api = authApis();
      const data = {
        rating: rating || null,
        comment,
      };

      if (editingReviewId) {
        
        await api.put(endpoints["update-review"](jobId, editingReviewId), data);
        toast.success("Cập nhật đánh giá thành công!");
        setEditingReviewId(null);
      } else {
        
        await api.post(endpoints["job-reviews"](jobId), data);
        toast.success("Gửi đánh giá thành công!");
      }

      
      setRating(0);
      setComment("");

      
      await loadReviews();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditReview = (review) => {
    setOpenMenuId(null);

    setEditingReviewId(review.id);
    setRating(review.rating);
    setComment(review.comment || "");
    
    setTimeout(() => {
      const formElement = document.querySelector('.review-form-container');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setRating(0);
    setComment("");
  };

  const handleDeleteReview = async (reviewId) => {
    setReviewToDelete(reviewId);
    setShowDeleteConfirm(true);
    setOpenMenuId(null);
  };

  const confirmDeleteReview = async () => {
    if (!reviewToDelete) return;

    try {
      const api = authApis();
      await api.delete(endpoints["delete-review"](jobId, reviewToDelete));
      toast.success("Xóa đánh giá thành công!");
      setMyReview(null);
      await loadReviews();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setShowDeleteConfirm(false);
      setReviewToDelete(null);
    }
  };

  const toggleMenu = (e, reviewId) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === reviewId ? null : reviewId);
  };

  
  useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuId) setOpenMenuId(null);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openMenuId]);

  const renderInteractiveStars = () => {
    const stars = [];
    const displayRating = hoverRating || rating;

    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`review-star ${i <= displayRating ? "filled" : ""} interactive`}
          onClick={() => setRating(i)}
          onMouseEnter={() => setHoverRating(i)}
          onMouseLeave={() => setHoverRating(0)}
        >
          ★
        </span>
      );
    }

    return stars;
  };

  const formatDate = (dateString) => {
    return moment(dateString).fromNow();
  };

  const isEdited = (review) => {
    if (!review.updated_at || !review.created_at) return false;
    const created = moment(review.created_at);
    const updated = moment(review.updated_at);
    
    return updated.diff(created, 'minutes') > 1;
  };

  return (
    <div className="job-reviews-section">
      
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteReview}
        title="Xóa đánh giá?"
        message="Bạn có chắc muốn xóa đánh giá này không? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        icon="none"
      />

      <div className="reviews-header">
        <h2 className="section-title">Đánh giá từ ứng viên</h2>
        {totalReviews > 0 && (
          <div className="rating-summary">
            <div className="avg-rating">
              <span className="rating-number">{avgRating.toFixed(1)}</span>
              <div className="stars-display">{renderStars(avgRating)}</div>
            </div>
            <span className="total-reviews">({totalReviews} đánh giá)</span>
          </div>
        )}
      </div>

      
      {user && user.role === "ungvien" && (!myReview || editingReviewId) && (
        <div className="review-form-container">
          <form onSubmit={handleSubmitReview} className="review-form">
            <div className="form-header">
              <h3>{editingReviewId ? "Chỉnh sửa đánh giá" : "Công việc này thế nào?"}</h3>
              {!editingReviewId && totalReviews === 0 && (
                <p className="first-review-text">
                  Chưa có đánh giá nào. Bạn là người đầu tiên!
                </p>
              )}
            </div>

            <div className="rating-input">
              <label>Bạn đánh giá công việc này:</label>
              <div className="stars-input">{renderInteractiveStars()}</div>
            </div>

            <div className="comment-input">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Chia sẻ cảm nhận của bạn về công việc này (bắt buộc)"
                rows="4"
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn-submit-review"
                disabled={submitting}
              >
                {submitting ? "Đang gửi..." : editingReviewId ? "Cập nhật" : "Gửi đánh giá"}
              </button>
              {editingReviewId && (
                <button
                  type="button"
                  className="btn-cancel-edit"
                  onClick={handleCancelEdit}
                >
                  Hủy
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      
      <div className="reviews-list">
        {loading ? (
          <div className="loading-reviews">
            <MySpinner />
          </div>
        ) : reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.id} className="review-item">
              <div className="review-avatar">
                <img
                  src={getApplicantAvatar(review.candidate_avatar)}
                  alt={review.candidate_name}
                  onError={onApplicantAvatarError}
                />
              </div>

              <div className="review-content">
                <div className="review-header">
                  <div className="reviewer-info">
                    <div className="reviewer-name-time">
                      <span className="reviewer-name">{review.candidate_name}</span>
                      <span className="review-date">
                        {formatDate(review.created_at)}
                        {isEdited(review) && <span className="edited-badge"> · Đã chỉnh sửa</span>}
                      </span>
                    </div>
                    <div className="review-rating">
                      {renderStars(review.rating)}
                    </div>
                  </div>

                  
                  {user && user.id === review.candidate_id && (
                    <div className="review-menu">
                      <button
                        className="menu-trigger"
                        onClick={(e) => toggleMenu(e, review.id)}
                      >
                        ⋮
                      </button>
                      {openMenuId === review.id && (
                        <div className="menu-dropdown">
                          <button
                            className="menu-item"
                            onClick={() => handleEditReview(review)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Chỉnh sửa
                          </button>
                          <button
                            className="menu-item delete"
                            onClick={() => handleDeleteReview(review.id)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <polyline points="3 6 5 6 21 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Xóa
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {review.comment && (
                  <p className="review-comment">{review.comment}</p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="no-reviews">
            <p>Chưa có đánh giá nào cho công việc này.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobReviews;
