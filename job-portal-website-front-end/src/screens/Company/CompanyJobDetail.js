import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authApis, endpoints } from "../../configs/Apis";
import Apis from "../../configs/Apis";
import { MyUserContext } from "../../configs/Contexts";
import { useToast } from "../../components/Toast";
import MySpinner from "../../components/MySpinner";
import "../../css/CompanyJobDetail.css";
import { getApiError } from "../../utils/apiError";

const CompanyJobDetail = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [user] = useContext(MyUserContext);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState([]);
  const [jobTypes, setJobTypes] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    if (!user || user.role !== "nhatuyendung") {
      toast.error("Bạn không có quyền truy cập trang này!");
      navigate("/");
      return;
    }

    loadLocations();
    loadJobTypes();
    loadJobDetail();
  }, [user, navigate, jobId]);

  const loadLocations = async () => {
    try {
      const response = await Apis.get(endpoints["locations"]);
      setLocations(response.data.locations || []);
    } catch (error) {
      console.error("Error loading locations:", error);
    }
  };

  const loadJobTypes = async () => {
    try {
      const response = await Apis.get(endpoints["job-types"]);
      setJobTypes(response.data.job_types || []);
    } catch (error) {
      console.error("Error loading job types:", error);
    }
  };

  const loadJobDetail = async () => {
    try {
      setLoading(true);
      const response = await authApis().get(
        endpoints["company-job-detail"](jobId)
      );
      setJob(response.data);
    } catch (error) {
      console.error("Error loading job detail:", error);
      toast.error(
        getApiError(error, "Không thể tải thông tin bài đăng!"),
      );
      navigate("/company/my-jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = job.status === "hoạt động" ? "ẩn" : "hoạt động";
    const actionText = newStatus === "ẩn" ? "ẨN" : "HIỂN THỊ";

    
    setConfirmAction({
      jobId: job.id,
      jobTitle: job.title,
      currentStatus: job.status,
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
        { status: newStatus },
      );

      toast.success(response.data.message);

      
      setJob({ ...job, status: newStatus });
    } catch (error) {
      console.error("Error updating job status:", error);
      toast.error(
        getApiError(error, "Không thể cập nhật trạng thái bài đăng!"),
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

  const formatSalary = (minSalary, maxSalary) => {
    if (!minSalary && !maxSalary) return "Thỏa thuận";

    const formatNumber = (num) => {
      return num.toLocaleString("vi-VN");
    };

    if (minSalary && maxSalary) {
      return `${formatNumber(minSalary)} - ${formatNumber(maxSalary)} VNĐ`;
    }
    if (minSalary) return `Từ ${formatNumber(minSalary)} VNĐ`;
    if (maxSalary) return `Đến ${formatNumber(maxSalary)} VNĐ`;
  };

  const formatDateOnly = (dateString) => {
    if (!dateString) return "N/A";
    
    return String(dateString).split(" ")[0];
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      "hoạt động": { text: "Đang tuyển", className: "status-badge-active" },
      "hết hạn": { text: "Hết hạn", className: "status-badge-expired" },
      ẩn: { text: "Đã ẩn", className: "status-badge-hidden" },
    };

    const config = statusConfig[status] || statusConfig["ẩn"];
    return (
      <span className={`job-status-badge ${config.className}`}>
        {config.text}
      </span>
    );
  };

  const handleEdit = () => {
    navigate(`/company/my-jobs/edit/${jobId}`);
  };

  const getLocationName = (locationId) => {
    const location = locations.find((loc) => loc.id === locationId);
    return location ? location.name : `Địa điểm ${locationId}`;
  };

  const getJobTypeName = (jobTypeId) => {
    const jobType = jobTypes.find((type) => type.id === jobTypeId);
    return jobType ? jobType.name : `Loại ${jobTypeId}`;
  };

  if (loading) {
    return <MySpinner />;
  }

  if (!job) {
    return (
      <div className="error-container">
        <p className="error-text">Không tìm thấy bài đăng</p>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/company/my-jobs")}
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="company-job-detail-container">
      
      <button className="btn-back" onClick={() => navigate("/company/my-jobs")}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path
            d="M19 12H5M12 19l-7-7 7-7"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Quay lại
      </button>

      <div className="job-detail-layout">
        
        <div className="job-detail-main">
          
          <div className="company-job-detail-header">
            {getStatusBadge(job.status)}
            <div className="job-title-bar">
              <h1 className="job-detail-title">{job.title}</h1>
              <div className="job-header-actions">
                <button className="btn-edit-detail" onClick={handleEdit}>
                  Chỉnh sửa
                </button>
                <button
                  className={`btn-toggle-job-status ${job.status === "hoạt động" ? "btn-hide" : "btn-show"}`}
                  onClick={handleToggleStatus}
                  title={
                    job.status === "hoạt động"
                      ? "Ẩn bài đăng"
                      : "Hiển thị bài đăng"
                  }
                >
                  {job.status === "hoạt động" ? (
                    <>Ẩn bài đăng</>
                  ) : (
                    <>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      Hiển thị bài đăng
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          
          <div className="job-description-card">
            <h2 className="section-title">Mô tả chi tiết công việc</h2>
            <div className="job-description-content">
              {job.description.split("\n").map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>

        
        <div className="job-info-section">
          <h2 className="section-title">Thông tin chung</h2>
          <div className="info-grid">
          <div className="info-item">
            <div className="info-content">
              <span className="info-label">Mức lương</span>
              <span className="info-value salary">
                {formatSalary(job.min_salary, job.max_salary)}
              </span>
            </div>
          </div>

          <div className="info-item">
            <div className="info-content">
              <span className="info-label">Địa điểm</span>
              <span className="info-value">
                {getLocationName(job.location_id)}
              </span>
            </div>
          </div>

          <div className="info-item">
            <div className="info-content">
              <span className="info-label">Loại công việc</span>
              <span className="info-value">
                {getJobTypeName(job.job_type_id)}
              </span>
            </div>
          </div>

          <div className="info-item">
            <div className="info-content">
              <span className="info-label">Hạn nộp hồ sơ</span>
              <span className="info-value deadline">{job.deadline}</span>
            </div>
          </div>

          <div className="info-item">
            <div className="info-content">
              <span className="info-label">Ngày đăng</span>
              <span className="info-value">{formatDateOnly(job.created_at)}</span>
            </div>
          </div>
          </div>
        </div>
      </div>

      
      {showConfirmModal && confirmAction && (
        <div className="modal-overlay" onClick={handleCancelToggleStatus}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            Bạn có xác nhận muốn {confirmAction.actionText.toLowerCase()} bài
            đăng
            <br />"{confirmAction.jobTitle}"?
            <div className="modal-actions">
              <button
                className="modal-btn modal-btn-cancel"
                onClick={handleCancelToggleStatus}
              >
                HỦY
              </button>
              <button
                className={`modal-btn modal-btn-confirm ${
                  confirmAction.newStatus === "ẩn"
                    ? "btn-danger"
                    : "btn-success"
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

export default CompanyJobDetail;
