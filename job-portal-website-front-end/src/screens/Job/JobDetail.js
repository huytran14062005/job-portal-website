import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Apis, { endpoints, authApis } from "../../configs/Apis";
import MySpinner from "../../components/MySpinner";
import { useToast } from "../../components/Toast";
import { MyUserContext } from "../../configs/Contexts";
import ApplyJobModal from "../../components/ApplyJobModal";
import JobReviews from "../../components/JobReviews";
import { getSavedJobStatusMap } from "./savedJobStatus";
import { isJobExpired } from "../../utils/jobExpiry";
import { getApiError } from "../../utils/apiError";
import {
  getCompanyLogo,
  onCompanyLogoError,
} from "../../utils/defaultImages";

const JobDetail = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user] = useContext(MyUserContext);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [relatedJobs, setRelatedJobs] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [savedJobs, setSavedJobs] = useState({}); 
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyInfo, setApplyInfo] = useState(null); 
  const [showRelatedJobs, setShowRelatedJobs] = useState(true); 

  useEffect(() => {
    loadJobDetail();
  }, [jobId]);

  useEffect(() => {
    if (user && job) {
      checkSavedStatus();
      checkAppliedStatus();
    }
  }, [user, job]);

  useEffect(() => {
    if (job) {
      loadRelatedJobs();
    }
  }, [job]);

  useEffect(() => {
    const loadRelatedSavedStatuses = async () => {
      if (!user || user.role !== "ungvien" || relatedJobs.length === 0) {
        setSavedJobs({});
        return;
      }

      try {
        const savedStatus = await getSavedJobStatusMap(
          authApis(),
          relatedJobs.map((relatedJob) => relatedJob.id),
        );
        setSavedJobs(savedStatus);
      } catch (err) {
        console.error("Error checking related jobs saved status:", err);
      }
    };

    loadRelatedSavedStatuses();
  }, [user, relatedJobs]);

  const loadJobDetail = async () => {
    try {
      setLoading(true);
      const response = await Apis.get(endpoints["job-details"](jobId));
      setJob(response.data);
      setError(null);
    } catch (err) {
      setError(getApiError(err, "Không thể tải thông tin công việc"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkSavedStatus = async () => {
    if (!user) return;

    try {
      const api = authApis();
      const response = await api.get(endpoints["check-saved"](jobId));
      setIsSaved(response.data.is_saved);
    } catch (err) {
      console.error("Error checking saved status:", err);
    }
  };

  const checkAppliedStatus = async () => {
    if (!user || user.role !== "ungvien") return;

    try {
      const api = authApis();
      const response = await api.get(endpoints["check-applied"](jobId));
      setApplyInfo(response.data);
    } catch (err) {
      console.error("Error checking applied status:", err);
    }
  };

  const loadRelatedJobs = async () => {
    try {
      setLoadingRelated(true);
      const response = await Apis.get(endpoints["related-jobs"](jobId), {
        params: { limit: 5 },
      });
      setRelatedJobs(response.data.jobs);
    } catch (err) {
      console.error("Error loading related jobs:", err);
      console.error("Error details:", err.response?.data);
    } finally {
      setLoadingRelated(false);
    }
  };

  const handleSaveRelatedJob = async (relatedJob, e) => {
    e.stopPropagation();

    const relatedJobId = relatedJob.id;

    if (!user) {
      toast.warning("Vui lòng đăng nhập để lưu công việc!");
      navigate("/login");
      return;
    }

    if (user.role !== "ungvien") {
      toast.warning("Chỉ ứng viên mới có thể lưu công việc!");
      return;
    }

    
    
    try {
      const api = authApis();
      const response = await api.post(endpoints["save-job"](relatedJobId));

      
      setSavedJobs((prev) => ({
        ...prev,
        [relatedJobId]: response.data.is_saved,
      }));

      if (response.data.is_saved) {
        toast.success("Đã lưu công việc!");
      } else {
        toast.info("Đã bỏ lưu công việc!");
      }
    } catch (err) {
      console.error("Error saving related job:", err);
      toast.error(
        getApiError(err, "Có lỗi xảy ra khi lưu công việc!"),
      );
    }
  };

  const handleSaveJob = async () => {
    if (!user) {
      toast.warning("Vui lòng đăng nhập để lưu công việc!");
      navigate("/login");
      return;
    }

    if (user.role !== "ungvien") {
      toast.warning("Chỉ ứng viên mới có thể lưu công việc!");
      return;
    }

    
    
    setSaving(true);

    try {
      const api = authApis();
      const response = await api.post(endpoints["save-job"](jobId));

      setIsSaved(response.data.is_saved);

      if (response.data.is_saved) {
        toast.success("Đã lưu công việc!");
      } else {
        toast.info("Đã bỏ lưu công việc!");
      }
    } catch (err) {
      console.error("Error saving job:", err);
      toast.error(
        getApiError(err, "Có lỗi xảy ra khi lưu công việc!"),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleApplyClick = () => {
    if (!user) {
      toast.warning("Vui lòng đăng nhập để ứng tuyển!");
      navigate("/login");
      return;
    }

    if (user.role !== "ungvien") {
      toast.warning("Chỉ ứng viên mới có thể ứng tuyển!");
      return;
    }

    
    
    setShowApplyModal(true);
  };

  const handleApplySuccess = () => {
    checkAppliedStatus();
  };

  
  const getApplyButtonState = () => {
    
    if (job?.status === "ẩn") {
      return { label: "Bài đăng đã đóng", disabled: true, className: "closed" };
    }

    
    if (isJobExpired(job)) {
      return {
        label: "Đã hết hạn ứng tuyển",
        disabled: false,
        className: "expired",
      };
    }

    if (!applyInfo || !applyInfo.is_applied) {
      return { label: "Ứng tuyển ngay", disabled: false, className: "" };
    }

    if (applyInfo.can_reapply) {
      return { label: "Ứng tuyển lại", disabled: false, className: "reapply" };
    }

    if (applyInfo.status === "đã duyệt") {
      return { label: "Đã được duyệt", disabled: true, className: "applied" };
    }

    if (applyInfo.status === "từ chối") {
      return { label: "Đã hết lượt nộp", disabled: true, className: "waiting" };
    }

    return { label: "Đã ứng tuyển", disabled: true, className: "applied" };
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

  if (loading) {
    return <MySpinner />;
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-text">{error}</p>
        <button className="btn btn-primary" onClick={() => navigate("/jobs")}>
          Quay lại danh sách
        </button>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="error-container">
        <p className="error-text">Không tìm thấy công việc</p>
        <button className="btn btn-primary" onClick={() => navigate("/jobs")}>
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const applyBtn = getApplyButtonState();

  return (
    <>
      <ApplyJobModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        jobId={jobId}
        jobTitle={job?.title}
        companyName={job?.company_name}
        onSuccess={handleApplySuccess}
      />

      <div className="job-detail-container">
        
        <button className="btn-back" onClick={() => navigate("/jobs")}>
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

        
        <div className="job-detail-header">
          <div className="job-header-content">
            <div className="job-header-left">
              <h1 className="job-detail-title">{job.title}</h1>
              <div className="job-company-info">
                <h2 className="job-company-name">{job.company_industry}</h2>
              </div>
            </div>

            <div className="job-header-actions">
              <button
                className={`btn-save-detail ${isSaved ? "saved" : ""} ${
                  !isSaved && isJobExpired(job) ? "expired" : ""
                }`}
                onClick={handleSaveJob}
                disabled={saving}
                title={
                  !isSaved && isJobExpired(job)
                    ? "Bài đăng đã hết hạn, không thể lưu tin"
                    : undefined
                }
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill={isSaved ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {isSaved ? "Đã lưu" : "Lưu tin"}
              </button>

              <button
                className={`btn-apply ${applyBtn.className}`}
                onClick={handleApplyClick}
                disabled={applyBtn.disabled}
              >
                {applyBtn.className !== "waiting" && (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    {applyBtn.className === "applied" ? (
                      <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
                    ) : applyBtn.className === "reapply" ? (
                      <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                    ) : applyBtn.className === "expired" ? (
                      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                    ) : (
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    )}
                  </svg>
                )}
                {applyBtn.label}
              </button>
            </div>
          </div>

          {job?.status === "ẩn" && (
            <div className="job-apply-notice job-closed-notice">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <span className="job-apply-notice-text">
                Bài đăng này đã bị đóng và không thể ứng tuyển được nữa.
              </span>
            </div>
          )}
          {applyInfo &&
            applyInfo.is_applied &&
            job?.status !== "ẩn" &&
            !isJobExpired(job) && (
              <div
                className={`job-apply-notice ${
                  applyInfo.status === "đã duyệt"
                    ? "approved-notice"
                    : applyInfo.can_reapply
                    ? "reapply-ready"
                    : ""
                }`}
              >
                <span className="job-apply-notice-text">
                  {applyInfo.can_reapply
                    ? "Đơn trước của bạn đã bị từ chối. Bạn có thể nộp lại với CV khác."
                    : applyInfo.reason}
                </span>
                <span className="job-apply-notice-chip">
                  Lần {applyInfo.apply_count}/{applyInfo.max_apply_times}
                </span>
              </div>
            )}
        </div>

        
        <div className="job-detail-content">
          
          <div className="job-detail-main">
            
            <div className="job-info-card">
              <h2 className="section-title">Thông tin chung</h2>
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-icon">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <rect
                        x="2"
                        y="7"
                        width="20"
                        height="14"
                        rx="2"
                        ry="2"
                        strokeWidth="2"
                      />
                      <path
                        d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                  <div className="info-content">
                    <span className="info-label">Mức lương</span>
                    <span className="info-value salary">
                      {formatSalary(job.min_salary, job.max_salary)}
                    </span>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
                        strokeWidth="2"
                      />
                      <circle cx="12" cy="10" r="3" strokeWidth="2" />
                    </svg>
                  </div>
                  <div className="info-content">
                    <span className="info-label">Địa điểm</span>
                    <span className="info-value">{job.location_name}</span>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <rect
                        x="3"
                        y="4"
                        width="18"
                        height="18"
                        rx="2"
                        ry="2"
                        strokeWidth="2"
                      />
                      <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" />
                      <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" />
                      <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" />
                    </svg>
                  </div>
                  <div className="info-content">
                    <span className="info-label">Hạn nộp hồ sơ</span>
                    <span className="info-value deadline">{job.deadline}</span>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <circle cx="12" cy="12" r="10" strokeWidth="2" />
                      <polyline points="12 6 12 12 16 14" strokeWidth="2" />
                    </svg>
                  </div>
                  <div className="info-content">
                    <span className="info-label">Hình thức làm việc</span>
                    <span className="info-value">{job.job_type_name}</span>
                  </div>
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

            
            {job.requirements && (
              <div className="job-description-card">
                <h2 className="section-title section-title-green">
                  Yêu cầu ứng viên
                </h2>
                <div className="job-description-content job-list-content">
                  {job.requirements.split("\n").map((item, index) => {
                    if (item.trim()) {
                      return <p key={index}>{item}</p>;
                    }
                    return null;
                  })}
                </div>
              </div>
            )}

            
            {job.benefits && (
              <div className="job-description-card">
                <h2 className="section-title section-title-green">
                  Quyền lợi ứng viên
                </h2>
                <div className="job-description-content job-list-content">
                  {job.benefits.split("\n").map((item, index) => {
                    if (item.trim()) {
                      return <p key={index}>{item}</p>;
                    }
                    return null;
                  })}
                </div>
              </div>
            )}

            
            <div className="related-jobs-section">
              <div className="related-jobs-header">
                <h2 className="section-title">Các công việc liên quan</h2>
                <button
                  className="toggle-related-jobs-btn"
                  onClick={() => setShowRelatedJobs(!showRelatedJobs)}
                  aria-label={showRelatedJobs ? "Thu gọn" : "Mở rộng"}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={showRelatedJobs ? "rotate-up" : "rotate-down"}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              </div>
              <div
                className={`related-jobs-content ${showRelatedJobs ? "expanded" : "collapsed"}`}
              >
                {loadingRelated ? (
                  <div className="loading-related">
                    <MySpinner />
                  </div>
                ) : relatedJobs.length > 0 ? (
                  <div className="related-jobs-list">
                    {relatedJobs.map((relatedJob) => (
                      <div key={relatedJob.id} className="related-job-card">
                        <div
                          className="related-job-logo"
                          onClick={() => navigate(`/jobs/${relatedJob.id}`)}
                        >
                          <img
                            src={getCompanyLogo(job.company_logo)}
                            alt={relatedJob.company_name}
                            className="related-job-logo-img"
                            onError={onCompanyLogoError}
                          />
                        </div>

                        <div
                          className="related-job-content"
                          onClick={() => navigate(`/jobs/${relatedJob.id}`)}
                        >
                          <h3 className="related-job-title">
                            {relatedJob.title}
                          </h3>
                          <p className="related-job-company">
                            {relatedJob.company_name}
                          </p>
                          <div className="related-job-location">
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                            >
                              <path
                                d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
                                strokeWidth="2"
                              />
                              <circle cx="12" cy="10" r="3" strokeWidth="2" />
                            </svg>
                            <span>{relatedJob.location_name}</span>
                          </div>
                        </div>

                        <div className="related-job-right">
                          <div className="related-job-salary">
                            {formatSalary(
                              relatedJob.min_salary,
                              relatedJob.max_salary,
                            )}
                          </div>
                          <button
                            className={`related-job-save-btn ${
                              savedJobs[relatedJob.id] ? "saved" : ""
                            } ${
                              !savedJobs[relatedJob.id] &&
                              isJobExpired(relatedJob)
                                ? "expired"
                                : ""
                            }`}
                            onClick={(e) => handleSaveRelatedJob(relatedJob, e)}
                            title={
                              savedJobs[relatedJob.id]
                                ? "Bỏ lưu công việc"
                                : isJobExpired(relatedJob)
                                  ? "Bài đăng đã hết hạn, không thể lưu tin"
                                  : "Lưu công việc"
                            }
                          >
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill={
                                savedJobs[relatedJob.id]
                                  ? "currentColor"
                                  : "none"
                              }
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-related-jobs">
                    <p>Hiện không có công việc liên quan nào.</p>
                  </div>
                )}
              </div>
            </div>

            
            <JobReviews jobId={jobId} />
          </div>

          
          <div className="job-detail-sidebar">
            
            <div className="company-card">
              <h3 className="sidebar-title">Thông tin công ty</h3>
              <div className="company-info">
                
                <div className="company-logo-container">
                  <img
                    src={getCompanyLogo(job.company_logo)}
                    alt={job.company_name}
                    className="company-logo-img"
                    onError={onCompanyLogoError}
                  />
                </div>

                
                <h4 className="company-card-name">{job.company_name}</h4>

                
                <div className="company-details">
                  {job.company_size && (
                    <div className="company-detail-item">
                      <span className="detail-label">Quy mô:</span>
                      <span className="detail-value">
                        {job.company_size.toLocaleString("vi-VN")} nhân viên
                      </span>
                    </div>
                  )}

                  {job.company_industry && (
                    <div className="company-detail-item">
                      <span className="detail-label">Lĩnh vực:</span>
                      <span className="detail-value">
                        {job.company_industry}
                      </span>
                    </div>
                  )}

                  {job.company_address && (
                    <div className="company-detail-item">
                      <span className="detail-label">Địa điểm:</span>
                      <span className="detail-value">
                        {job.company_address}
                      </span>
                    </div>
                  )}
                </div>

                
                <button
                  className="btn-view-company"
                  onClick={() => navigate(`/companies/${job.company_id}`)}
                >
                  Xem trang công ty
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default JobDetail;
