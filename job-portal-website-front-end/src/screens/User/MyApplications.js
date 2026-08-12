import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authApis, endpoints } from "../../configs/Apis";
import ApplyJobModal from "../../components/ApplyJobModal";
import Pagination from "../../components/Pagination";
import "../../css/MyApplications.css";
import { getApiError } from "../../utils/apiError";

const MyApplications = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const [reapplyTarget, setReapplyTarget] = useState(null); 
  const [reapplyDone, setReapplyDone] = useState(false);

  useEffect(() => {
    fetchApplications(currentPage);
  }, [currentPage, activeTab]);

  const fetchApplications = async (page) => {
    try {
      setLoading(true);
      setError("");

      const api = authApis();
      const response = await api.get(endpoints["my-applications"], {
        params: { page },
      });

      setApplications(response.data.applications || []);
      setTotalPages(response.data.pages || 1);
    } catch (err) {
      console.error("Error fetching applications:", err);
      setError(
        getApiError(err, "Không thể tải danh sách đơn ứng tuyển. Vui lòng thử lại sau."),
      );
    } finally {
      setLoading(false);
    }
  };

  const statusTabs = [
    { key: "all", label: "Tất cả" },
    { key: "đã nộp", label: "Đã nộp" },
    { key: "đã duyệt", label: "Đã duyệt" },
    { key: "từ chối", label: "Từ chối" },
  ];

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setCurrentPage(1);
  };

  const getFilteredApplications = () => {
    if (activeTab === "all") {
      return applications;
    }
    return applications.filter((app) => app.status === activeTab);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      "đã nộp": {
        className: "status-badge-pending",
        icon: (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <polyline points="12 6 12 12 16 14" strokeWidth="2" />
          </svg>
        ),
        text: "Đã nộp",
      },
      "đã duyệt": {
        className: "status-badge-approved",
        icon: (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeWidth="2" />
            <polyline points="22 4 12 14.01 9 11.01" strokeWidth="2" />
          </svg>
        ),
        text: "Đã duyệt",
      },
      "từ chối": {
        className: "status-badge-rejected",
        icon: (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <line x1="15" y1="9" x2="9" y2="15" strokeWidth="2" />
            <line x1="9" y1="9" x2="15" y2="15" strokeWidth="2" />
          </svg>
        ),
        text: "Từ chối",
      },
    };

    const config = statusConfig[status] || statusConfig["đã nộp"];

    return (
      <span className={`status-badge ${config.className}`}>
        {config.icon}
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  
  const getDateLabel = (application) => {
    if (application.status === "từ chối" && application.rejected_at) {
      return `Từ chối ${formatDate(application.rejected_at)}`;
    }
    return `Nộp ${formatDate(application.applied_at)}`;
  };

  const getHintText = (application) => {
    if (application.status === "đã nộp") {
      return "Đang chờ nhà tuyển dụng duyệt";
    }
    if (application.status === "đã duyệt") {
      return "Hồ sơ đã được duyệt";
    }
    if (application.can_reapply) {
      return `Bạn còn ${application.attempts_left} lượt nộp`;
    }
    return application.reason;
  };

  const getHintClass = (status, canReapply) => {
    if (status === "đã nộp") return "hint-pending";
    if (status === "đã duyệt") return "hint-approved";
    if (canReapply) return "hint-ready";
    return "hint-blocked";
  };

  const handleReapplyClick = (application, e) => {
    e.stopPropagation();
    setReapplyTarget(application);
  };

  const handleReapplySuccess = () => {
    
    setReapplyDone(true);
  };

  const handleReapplyClose = () => {
    setReapplyTarget(null);

    if (reapplyDone) {
      setReapplyDone(false);
      fetchApplications(currentPage);
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };


  if (loading) {
    return (
      <div className="my-applications-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Đang tải danh sách...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-applications-container">
        <div className="error-state">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ef4444"
          >
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" />
            <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" />
          </svg>
          <h3>Có lỗi xảy ra</h3>
          <p>{error}</p>
          <button
            className="btn-retry"
            onClick={() => fetchApplications(currentPage)}
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const filteredApplications = getFilteredApplications();

  return (
    <div className="my-applications-container">
      <ApplyJobModal
        isOpen={reapplyTarget !== null}
        onClose={handleReapplyClose}
        jobId={reapplyTarget?.job_post_id}
        jobTitle={reapplyTarget?.job_title}
        companyName={reapplyTarget?.company_name}
        onSuccess={handleReapplySuccess}
      />

      <div className="applications-header">
        <div className="header-content">
          <h1 className="page-title">Việc làm đã ứng tuyển</h1>
        </div>
      </div>

      
      <div className="status-tabs">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            className={`status-tab ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => handleTabChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {applications.length === 0 ? (
        <div className="empty-state">
          <svg
            width="120"
            height="120"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#d1d5db"
          >
            <path
              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
              strokeWidth="1.5"
            />
            <polyline points="14 2 14 8 20 8" strokeWidth="1.5" />
            <line x1="16" y1="13" x2="8" y2="13" strokeWidth="1.5" />
            <line x1="16" y1="17" x2="8" y2="17" strokeWidth="1.5" />
          </svg>
          <h3>Chưa có đơn ứng tuyển</h3>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="empty-state">
          <svg
            width="120"
            height="120"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#d1d5db"
          >
            <path
              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
              strokeWidth="1.5"
            />
            <polyline points="14 2 14 8 20 8" strokeWidth="1.5" />
            <line x1="16" y1="13" x2="8" y2="13" strokeWidth="1.5" />
            <line x1="16" y1="17" x2="8" y2="17" strokeWidth="1.5" />
          </svg>
          <h3>Không có đơn ứng tuyển</h3>
          <p>Không tìm thấy đơn ứng tuyển nào với trạng thái này</p>
        </div>
      ) : (
        <>
          <div className="applications-grid">
            {filteredApplications.map((application) => (
              <div
                key={application.id}
                className="application-card"
                onClick={() =>
                  navigate(`/jobs/${application.job_post_id || application.id}`)
                }
              >
                
                <div className="card-head">
                  <div className="card-logo">
                    {application.company_name.charAt(0).toUpperCase()}
                  </div>

                  <div className="card-heading">
                    <h3 className="card-job-title">{application.job_title}</h3>
                    <p className="card-company-name">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
                      </svg>
                      {application.company_name}
                    </p>
                  </div>

                  {getStatusBadge(application.status)}
                </div>

                
                <div className="card-meta">
                  <span className="card-meta-item">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    {getDateLabel(application)}
                  </span>

                  <span
                    className={`card-attempt-chip ${
                      application.attempts_left === 0 ? "exhausted" : ""
                    }`}
                  >
                    Lần {application.apply_count}/{application.max_apply_times}
                  </span>
                </div>

                
                <div className="card-footer">
                  <span
                    className={`card-hint ${getHintClass(application.status, application.can_reapply)}`}
                  >
                    {getHintText(application)}
                  </span>

                  {application.can_reapply && (
                    <button
                      className="btn-reapply"
                      onClick={(e) => handleReapplyClick(application, e)}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                      </svg>
                      Ứng tuyển lại
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Pagination
            page={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            disabled={loading}
          />
        </>
      )}
    </div>
  );
};

export default MyApplications;
