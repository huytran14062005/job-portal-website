import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import { MyUserContext } from "../../configs/Contexts";
import { useToast } from "../../components/Toast";
import Pagination from "../../components/Pagination";
import "../../css/CompanyMyJobs.css";
import { getApiError } from "../../utils/apiError";

const CompanyMyJobs = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [user] = useContext(MyUserContext);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailJob, setDetailJob] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [jobTypes, setJobTypes] = useState([]);

  useEffect(() => {
    
    if (!user || user.role !== "nhatuyendung") {
      toast.error("Bạn không có quyền truy cập trang này!");
      navigate("/");
      return;
    }

    fetchCompanyJobs();
  }, [user, navigate, pagination.page]);

  useEffect(() => {
    
    const loadCategories = async () => {
      try {
        const [locationRes, jobTypeRes] = await Promise.all([
          Apis.get(endpoints["locations"]),
          Apis.get(endpoints["job-types"]),
        ]);
        setLocations(locationRes.data.locations || []);
        setJobTypes(jobTypeRes.data.job_types || []);
      } catch (error) {
        console.error("Error loading categories:", error);
      }
    };

    loadCategories();
  }, []);

    const formatDateOnly = (dateString) => {
    if (!dateString) return "N/A";
    
    return String(dateString).split(" ")[0];
  };

  const fetchCompanyJobs = async () => {
    try {
      setLoading(true);
      const response = await authApis().get(endpoints["company-my-jobs"], {
        params: {
          page: pagination.page,
        },
      });

      setJobs(response.data.jobs || []);
      setPagination({
        page: response.data.current_page || 1,
        pages: response.data.pages || 1,
        total: response.data.total || 0,
      });
    } catch (error) {
      console.error("Error fetching company jobs:", error);
      console.error("Error response:", error.response?.data);
      toast.error(
        getApiError(error, "Không thể tải danh sách bài đăng!"),
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  const handleToggleStatus = async (jobId, jobTitle, currentStatus) => {
    
    const newStatus = currentStatus === "hoạt động" ? "ẩn" : "hoạt động";
    const actionText = newStatus === "ẩn" ? "ẨN" : "HIỂN THỊ";
    
    
    setConfirmAction({
      jobId,
      jobTitle,
      currentStatus,
      newStatus,
      actionText,
    });
    setShowConfirmModal(true);
  };

  const handleConfirmToggleStatus = async () => {
    if (!confirmAction) return;

    const { jobId, newStatus } = confirmAction;

    try {
      const response = await authApis().put(
        endpoints["company-job-status"](jobId),
        { status: newStatus }
      );

      toast.success(response.data.message);

      
      setDetailJob((prev) =>
        prev && prev.id === jobId ? { ...prev, status: newStatus } : prev
      );

      
      fetchCompanyJobs();
    } catch (error) {
      console.error("Error updating job status:", error);
      toast.error(
        getApiError(error, "Không thể cập nhật trạng thái bài đăng!")
      );
    } finally {
      setShowConfirmModal(false);
      setConfirmAction(null);
    }
  };

  const handleCancelToggleStatus = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  const handleViewJob = async (jobId) => {
    setShowDetailModal(true);
    setDetailJob(null);
    setDetailLoading(true);

    try {
      const response = await authApis().get(
        endpoints["company-job-detail"](jobId)
      );
      setDetailJob(response.data);
    } catch (error) {
      console.error("Error loading job detail:", error);
      toast.error(getApiError(error, "Không thể tải thông tin bài đăng!"));
      setShowDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setDetailJob(null);
  };

  const getLocationName = (locationId) => {
    const location = locations.find((loc) => loc.id === locationId);
    return location ? location.name : `Địa điểm ${locationId}`;
  };

  const getJobTypeName = (jobTypeId) => {
    const jobType = jobTypes.find((type) => type.id === jobTypeId);
    return jobType ? jobType.name : `Loại ${jobTypeId}`;
  };

  const handleEditJob = (jobId) => {
    navigate(`/company/my-jobs/edit/${jobId}`);
  };

  const formatSalary = (min, max) => {
    if (!min && !max) return "Thỏa thuận";

    const formatNumber = (num) => {
      return num.toLocaleString("vi-VN");
    };

    if (min && max) {
      return `${formatNumber(min)} - ${formatNumber(max)} VNĐ`;
    }
    if (min) return `Từ ${formatNumber(min)} VNĐ`;
    if (max) return `Đến ${formatNumber(max)} VNĐ`;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      "hoạt động": { className: "status-active", label: "Đang tuyển" },
      "hết hạn": { className: "status-expired", label: "Hết hạn" },
      ẩn: { className: "status-hidden", label: "Đã ẩn" },
    };

    const config = statusConfig[status] || statusConfig["ẩn"];
    return (
      <span className={`job-status-badge ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return dateString;
  };

  if (loading && pagination.page === 1) {
    return (
      <div className="company-my-jobs-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải danh sách bài đăng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="company-my-jobs-container">
      <div className="company-my-jobs-header">
        <h1>Bài đăng tuyển dụng của tôi</h1>
      </div>

      {jobs.length === 0 ? (
        <div className="no-jobs-message">
          <svg
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
          <h3>Chưa có bài đăng tuyển dụng nào</h3>
          <p>Hãy bắt đầu đăng tin tuyển dụng để tìm kiếm nhân tài!</p>
        </div>
      ) : (
        <>
          <div className="company-jobs-grid">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="company-job-card"
                onClick={() => handleViewJob(job.id)}
              >
                <div className="job-card-header">
                  <h3 className="job-title">{job.title}</h3>
                  {getStatusBadge(job.status)}
                </div>

                <div className="job-card-body">
                  <div className="job-info-item">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="12" y1="1" x2="12" y2="23" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                    <span>{formatSalary(job.min_salary, job.max_salary)}</span>
                  </div>

                  <div className="job-info-item">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span>Hạn nộp: {formatDate(job.deadline)}</span>
                  </div>

                  <div className="job-info-item">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>Đăng: {formatDateOnly(job.created_at)}</span>
                  </div>
                </div>

                <div className="job-card-footer">
                  <button
                    className="btn-view-detail"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewJob(job.id);
                    }}
                  >
                    Xem chi tiết
                  </button>
                  <button
                    className="btn-edit-job"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditJob(job.id);
                    }}
                    title="Chỉnh sửa bài đăng"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    className={`btn-toggle-status ${job.status === "hoạt động" ? "status-hide" : "status-show"}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStatus(job.id, job.title, job.status);
                    }}
                    title={job.status === "hoạt động" ? "Ẩn bài đăng" : "Hiển thị bài đăng"}
                  >
                    {job.status === "hoạt động" ? (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          
          <Pagination
            page={pagination.page}
            totalPages={pagination.pages}
            onPageChange={handlePageChange}
            disabled={loading}
          />
        </>
      )}

      
      {showDetailModal && (
        <div className="job-detail-overlay" onClick={handleCloseDetailModal}>
          <div
            className="job-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="job-detail-close"
              onClick={handleCloseDetailModal}
              title="Đóng"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {detailLoading || !detailJob ? (
              <div className="job-detail-modal-loading">
                <div className="spinner"></div>
                <p>Đang tải thông tin bài đăng...</p>
              </div>
            ) : (
              <>
                <div className="job-detail-modal-header">
                  <h2>{detailJob.title}</h2>
                  {getStatusBadge(detailJob.status)}
                </div>

                <div className="job-detail-modal-body">
                  <div className="detail-row">
                    <span className="detail-label">Mức lương</span>
                    <span className="detail-value salary">
                      {formatSalary(detailJob.min_salary, detailJob.max_salary)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Địa điểm</span>
                    <span className="detail-value">
                      {getLocationName(detailJob.location_id)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Loại công việc</span>
                    <span className="detail-value">
                      {getJobTypeName(detailJob.job_type_id)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Hạn nộp hồ sơ</span>
                    <span className="detail-value">{detailJob.deadline}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Ngày đăng</span>
                    <span className="detail-value">
                      {formatDateOnly(detailJob.created_at)}
                    </span>
                  </div>

                  <div className="detail-description">
                    <span className="detail-label">Mô tả công việc</span>
                    <div className="detail-description-content">
                      {(detailJob.description || "")
                        .split("\n")
                        .map((paragraph, index) => (
                          <p key={index}>{paragraph}</p>
                        ))}
                    </div>
                  </div>
                </div>

                <div className="job-detail-modal-footer">
                  <button
                    className="detail-btn detail-btn-edit"
                    onClick={() => handleEditJob(detailJob.id)}
                  >
                    Chỉnh sửa
                  </button>
                  <button
                    className={`detail-btn ${
                      detailJob.status === "hoạt động"
                        ? "detail-btn-hide"
                        : "detail-btn-show"
                    }`}
                    onClick={() =>
                      handleToggleStatus(
                        detailJob.id,
                        detailJob.title,
                        detailJob.status
                      )
                    }
                  >
                    {detailJob.status === "hoạt động"
                      ? "Ẩn bài đăng"
                      : "Hiển thị bài đăng"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      
      {showConfirmModal && confirmAction && (
        <div className="modal-overlay" onClick={handleCancelToggleStatus}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>

              Bạn có xác nhận muốn {confirmAction.actionText.toLowerCase()} bài đăng
              <br />
              "{confirmAction.jobTitle}"?
            
            <div className="modal-actions">
              <button
                className="modal-btn modal-btn-cancel"
                onClick={handleCancelToggleStatus}
              >
                HỦY
              </button>
              <button
                className={`modal-btn modal-btn-confirm ${
                  confirmAction.newStatus === "ẩn" ? "btn-danger" : "btn-success"
                }`}
                onClick={handleConfirmToggleStatus}
              >
                {confirmAction.actionText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyMyJobs;
