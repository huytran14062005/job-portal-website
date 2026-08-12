import React, { useState, useEffect, useRef, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Apis, { endpoints, authApis } from "../../configs/Apis";
import ChatModal from "../../components/ChatModal";
import { MyUserContext } from "../../configs/Contexts";
import * as Firebase from "../../utils/firebase";
import { useToast } from "../../components/Toast";
import Pagination from "../../components/Pagination";
import "../../css/CompanyDetail.css";
import { getApiError } from "../../utils/apiError";
import {
  getCompanyLogo,
  onCompanyLogoError,
} from "../../utils/defaultImages";

const CompanyDetail = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [user] = useContext(MyUserContext);
  const toast = useToast();
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    pages: 0,
  });

  
  const [isFollowed, setIsFollowed] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const chatUnreadRef = useRef(null);

  useEffect(() => {
    fetchCompanyDetail();
    fetchFollowersCount();
    if (user && user.role === "ungvien") {
      checkFollowStatus();
    }
  }, [companyId, user]);

  
  
  useEffect(() => {
    const recruiterId = company?.user_id;

    if (!user || user.role !== "ungvien" || !recruiterId) {
      setChatUnreadCount(0);
      return;
    }

    let cancelled = false;

    const subscribe = async () => {
      
      const authResult = await Firebase.ensureFirebaseAuth();
      if (cancelled) return;

      if (!authResult.success) {
        console.error(
          "[CompanyDetail] Firebase auth failed:",
          authResult.error,
        );
        return;
      }

      chatUnreadRef.current = Firebase.listenToCandidateUnreadWithRecruiter(
        user.id,
        recruiterId,
        (unread) => {
          if (cancelled) return;
          setChatUnreadCount(unread);
        },
      );
    };

    subscribe();

    return () => {
      cancelled = true;
      if (chatUnreadRef.current) {
        Firebase.stopListeningToMessages(chatUnreadRef.current);
        chatUnreadRef.current = null;
      }
    };
  }, [user, company?.user_id]);

  useEffect(() => {
    fetchCompanyJobs();
  }, [companyId, pagination.page]);

  const fetchCompanyDetail = async () => {
    try {
      setLoading(true);
      const response = await Apis.get(endpoints["company-detail"](companyId));
      setCompany(response.data);
    } catch (err) {
      setError(
        getApiError(err, "Không thể tải thông tin công ty. Vui lòng thử lại sau."),
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowersCount = async () => {
    try {
      const response = await Apis.get(endpoints["followers-count"](companyId));
      setFollowersCount(response.data.followers_count);
    } catch (err) {
      console.error("Error fetching followers count:", err);
    }
  };

  const checkFollowStatus = async () => {
    try {
      const api = authApis();
      const response = await api.get(endpoints["check-followed"](companyId));
      setIsFollowed(response.data.is_followed);
    } catch (err) {
      console.error("Error checking follow status:", err);
    }
  };

  const handleFollowToggle = async () => {
    if (!user) {
      toast.warning("Vui lòng đăng nhập để follow công ty!");
      navigate("/login");
      return;
    }

    if (user.role !== "ungvien") {
      toast.warning("Chỉ ứng viên mới có thể follow công ty!");
      return;
    }

    setFollowLoading(true);

    try {
      const api = authApis();
      const response = await api.post(endpoints["follow-company"](companyId));

      setIsFollowed(response.data.is_followed);
      
      
      if (response.data.is_followed) {
        setFollowersCount((prev) => prev + 1);
        toast.success("Đã follow công ty!");
      } else {
        setFollowersCount((prev) => prev - 1);
        toast.info("Đã bỏ follow công ty!");
      }
    } catch (err) {
      console.error("Error toggling follow:", err);
      toast.error(getApiError(err, "Có lỗi xảy ra!"));
    } finally {
      setFollowLoading(false);
    }
  };

  const fetchCompanyJobs = async () => {
    try {
      setLoadingJobs(true);
      const response = await Apis.get(endpoints["company-jobs"](companyId), {
        params: {
          page: pagination.page,
        },
      });

      setJobs(response.data.jobs || []);
      setPagination({
        page: response.data.current_page,
        total: response.data.total,
        pages: response.data.pages,
      });
    } catch (err) {
      console.error("Error fetching company jobs:", err);
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleViewJob = (jobId) => {
    navigate(`/jobs/${jobId}`);
  };

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

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenChat = () => {
    if (!user) {
      alert("Vui lòng đăng nhập để nhắn tin với công ty");
      navigate("/login");
      return;
    }
    if (user.role !== "ungvien") {
      alert("Chỉ ứng viên mới có thể nhắn tin với công ty");
      return;
    }
    setShowChatModal(true);
  };

  if (loading) {
    return (
      <div className="cd-page">
        <div className="cd-loading">
          <div className="spinner"></div>
          <p>Đang tải thông tin công ty...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cd-page">
        <div className="alert alert-error">{error}</div>
        <button className="btn btn-primary" onClick={() => navigate("/jobs")}>
          Quay lại danh sách việc làm
        </button>
      </div>
    );
  }

  return (
    <div className="cd-page">
      <button className="cd-back" onClick={() => navigate(-1)}>
        <svg
          width="18"
          height="18"
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

      
      <div className="cd-hero">
        <div className="cd-hero-banner"></div>
        <div className="cd-hero-body">
          <div className="cd-logo">
            <img
              src={getCompanyLogo(company?.logo_url)}
              alt={company?.company_name}
              onError={onCompanyLogoError}
            />
          </div>

          <div className="cd-hero-main">
            <div className="cd-hero-top">
              <div className="cd-hero-info-section">
                <div className="cd-hero-title-row">
                  <h1 className="cd-name">{company?.company_name}</h1>
                  {company?.industry && (
                    <span className="cd-chip">{company.industry}</span>
                  )}
                </div>

                
                <div className="cd-followers-info">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span>{followersCount} người đang follow</span>
                </div>
              </div>

              
              {user && user.role === "ungvien" && (
                <div className="cd-action-buttons">
                  <button
                    className={`cd-btn-follow ${isFollowed ? "followed" : ""}`}
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    title={isFollowed ? "Bỏ follow" : "Follow công ty"}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill={isFollowed ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                    {isFollowed ? "Đang theo dõi" : "Theo dõi"}
                  </button>
                  <button
                    className="cd-btn-chat"
                    onClick={handleOpenChat}
                    title="Nhắn tin với công ty"
                    style={{ position: "relative" }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    Nhắn tin
                    {chatUnreadCount > 0 && (
                      <span
                        style={{
                          position: "absolute",
                          top: "-5px",
                          right: "-5px",
                          backgroundColor: "#dc3545",
                          color: "white",
                          borderRadius: "50%",
                          width: "20px",
                          height: "20px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "11px",
                          fontWeight: "bold",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                        }}
                      >
                        {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
                      </span>
                    )}
                  </button>
                </div>
              )}

              
              
            </div>

            
            {company?.description && (
              <div>
                <h3 className="cd-hero-description-title">
                  Giới thiệu về công ty:
                </h3>
                <p>{company.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="cd-layout">
        <div className="cd-main">
          
          <div className="cd-card">
            <div className="cd-card-head">
              <h2 className="cd-card-title">Vị trí đang tuyển</h2>
              {pagination.total > 0 && (
                <span className="cd-count">{pagination.total} vị trí</span>
              )}
            </div>

            {loadingJobs && jobs.length === 0 ? (
              <div className="cd-loading">
                <div className="spinner"></div>
                <p>Đang tải danh sách việc làm...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="cd-empty">
                <svg
                  width="56"
                  height="56"
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
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <h3>Chưa có vị trí tuyển dụng</h3>
                <p>Công ty hiện chưa có vị trí tuyển dụng nào</p>
              </div>
            ) : (
              <>
                <div className="cd-jobs">
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      className="cd-job"
                      role="button"
                      tabIndex={0}
                      onClick={() => handleViewJob(job.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleViewJob(job.id);
                        }
                      }}
                    >
                      <div className="cd-job-main">
                        <h3 className="cd-job-title">{job.title}</h3>

                        <div className="cd-job-meta">
                          {job.location && (
                            <span>
                              <svg
                                width="15"
                                height="15"
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
                              {job.location}
                            </span>
                          )}

                          {job.job_type && (
                            <span>
                              <svg
                                width="15"
                                height="15"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                              >
                                <circle
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  strokeWidth="2"
                                />
                                <polyline
                                  points="12 6 12 12 16 14"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              {job.job_type}
                            </span>
                          )}

                          {(job.salary_min || job.salary_max) && (
                            <span className="cd-job-salary">
                              <svg
                                width="15"
                                height="15"
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
                              {formatSalary(job.salary_min, job.salary_max)}
                            </span>
                          )}
                        </div>

                        {job.description && (
                          <p className="cd-job-desc">{job.description}</p>
                        )}
                      </div>

                      <div className="cd-job-side">
                        {job.deadline && (
                          <span className="cd-job-deadline">
                            Hạn: {job.deadline}
                          </span>
                        )}
                        <span className="cd-job-cta">
                          Xem chi tiết
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                          >
                            <line
                              x1="5"
                              y1="12"
                              x2="19"
                              y2="12"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                            <polyline
                              points="12 5 19 12 12 19"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <Pagination
                  page={pagination.page}
                  totalPages={pagination.pages}
                  onPageChange={handlePageChange}
                  disabled={loadingJobs}
                />
              </>
            )}
          </div>
        </div>

        
        <aside className="cd-aside">
          <div className="cd-card">
            <div className="cd-card-head">
              <h2 className="cd-card-title">Thông tin chi tiết :</h2>
            </div>
            <ul className="cd-info-list">
              {company?.industry && (
                <li>
                  <svg
                    width="17"
                    height="17"
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
                  <div>
                    <div className="cd-info-label">Lĩnh vực</div>
                    <div className="cd-info-value">{company.industry}</div>
                  </div>
                </li>
              )}

              {company?.company_size && (
                <li>
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="9" cy="7" r="4" strokeWidth="2" />
                    <path
                      d="M23 21v-2a4 4 0 0 0-3-3.87"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div>
                    <div className="cd-info-label">Quy mô</div>
                    <div className="cd-info-value">
                      {company.company_size} nhân viên
                    </div>
                  </div>
                </li>
              )}

              {company?.address && (
                <li>
                  <svg
                    width="17"
                    height="17"
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
                  <div>
                    <div className="cd-info-label">Địa chỉ</div>
                    <div className="cd-info-value">{company.address}</div>
                  </div>
                </li>
              )}

              {company?.website && (
                <li>
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                    <line x1="2" y1="12" x2="22" y2="12" strokeWidth="2" />
                    <path
                      d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
                      strokeWidth="2"
                    />
                  </svg>
                  <div>
                    <div className="cd-info-label">Website</div>
                    <div className="cd-info-value">
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {company.website}
                      </a>
                    </div>
                  </div>
                </li>
              )}
            </ul>
          </div>
        </aside>
      </div>

      
      {showChatModal && company && (
        <ChatModal
          isOpen={showChatModal}
          onClose={() => setShowChatModal(false)}
          otherUserId={company.user_id}
          otherUserName={company.company_name}
          otherUserAvatar={company.logo_url}
          otherUserRole="nhatuyendung"
          companyName={company.company_name}
          companyId={company.id}
        />
      )}
    </div>
  );
};

export default CompanyDetail;
