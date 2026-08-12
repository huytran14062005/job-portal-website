import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authApis, endpoints } from "../../configs/Apis";
import Pagination from "../../components/Pagination";
import { useToast } from "../../components/Toast";
import { getApiError } from "../../utils/apiError";
import {
  getCompanyLogo,
  onCompanyLogoError,
} from "../../utils/defaultImages";

const SavedJobs = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 0,
  });

  const formatSalary = (min, max) => {
    if (!min && !max) return "Thỏa thuận";

    const formatNumber = (num) => {
      
      return (num * 1000000).toLocaleString("vi-VN");
    };

    if (min && max) {
      return `${formatNumber(min)} - ${formatNumber(max)} VNĐ`;
    }
    if (min) return `Từ ${formatNumber(min)} VNĐ`;
    if (max) return `Đến ${formatNumber(max)} VNĐ`;
    return "Thỏa thuận";
  };

  useEffect(() => {
    fetchSavedJobs();
  }, [pagination.page]);

  const fetchSavedJobs = async () => {
    try {
      setLoading(true);
      const response = await authApis().get(endpoints["saved-jobs"], {
        params: {
          page: pagination.page,
          limit: 10,
        },
      });

      setJobs(response.data.jobs || []);
      setPagination({
        page: response.data.page,
        total: response.data.total,
        totalPages: response.data.total_pages,
      });
    } catch (err) {
      setError(
        getApiError(err, "Không thể tải danh sách việc làm đã lưu. Vui lòng thử lại sau."),
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsaveJob = async (jobId) => {
    try {
      await authApis().post(endpoints["save-job"](jobId));
      toast.info("Đã bỏ lưu công việc!");
      
      fetchSavedJobs();
    } catch (err) {
      console.error("Error unsaving job:", err);
      toast.error(getApiError(err, "Không thể bỏ lưu công việc. Vui lòng thử lại!"));
    }
  };

  const handleViewJob = (jobId) => {
    navigate(`/jobs/${jobId}`);
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading && pagination.page === 1) {
    return (
      <div className="saved-jobs-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải danh sách việc làm...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="saved-jobs-container">
      <div className="saved-jobs-header">
        <h1 className="saved-jobs-title">Việc làm đã lưu</h1>
        {pagination.total > 0 && (
          <p className="saved-jobs-count">
            Tổng cộng: <strong>{pagination.total}</strong> việc làm
          </p>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {jobs.length === 0 && !loading ? (
        <div className="empty-state">
          <svg
            width="120"
            height="120"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h2>Chưa có việc làm đã lưu</h2>
          <p>Hãy khám phá và lưu những công việc phù hợp với bạn</p>
          <button className="btn btn-primary" onClick={() => navigate("/jobs")}>
            Tìm việc ngay
          </button>
        </div>
      ) : (
        <>
          <div className="saved-jobs-grid">
            {jobs.map((job) => (
              <div key={job.id} className="job-card saved-job-card">
                <div className="job-card-header">
                  <img
                    src={getCompanyLogo(job.company_logo)}
                    alt={job.company_name}
                    className="company-logo-small"
                    onError={onCompanyLogoError}
                  />
                  <div className="job-card-title-section">
                    <h3 className="job-card-title">{job.title}</h3>
                    <p className="job-card-company">{job.company_name}</p>
                  </div>
                </div>

                <div className="job-card-details">
                  {job.location && (
                    <div className="job-detail-item">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle cx="12" cy="10" r="3" strokeWidth="2" />
                      </svg>
                      <span>{job.location}</span>
                    </div>
                  )}

                  {job.salary_min && job.salary_max && (
                    <div className="job-detail-item">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <line
                          x1="12"
                          y1="1"
                          x2="12"
                          y2="23"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>
                        {formatSalary(job.salary_min, job.salary_max)}
                      </span>
                    </div>
                  )}

                  {job.job_type && (
                    <div className="job-detail-item">
                      <svg
                        width="16"
                        height="16"
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
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>{job.job_type}</span>
                    </div>
                  )}
                </div>

                {job.description && (
                  <p className="job-card-description">
                    {job.description.length > 150
                      ? `${job.description.substring(0, 150)}...`
                      : job.description}
                  </p>
                )}

                <div className="job-card-actions">
                  <button
                    className="btn btn-outline"
                    onClick={() => handleViewJob(job.id)}
                  >
                    Xem chi tiết
                  </button>
                  <button
                    className="btn-unsave"
                    onClick={() => handleUnsaveJob(job.id)}
                    title="Bỏ lưu"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      stroke="currentColor"
                    >
                      <path
                        d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            disabled={loading}
          />
        </>
      )}
    </div>
  );
};

export default SavedJobs;
