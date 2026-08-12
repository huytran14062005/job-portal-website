import { useState, useEffect, useRef, useContext } from "react";
import { authApis, endpoints } from "../../configs/Apis";
import { useToast } from "../../components/Toast";
import { ApplicationStatus } from "../../configs/constants";
import { MyUserContext } from "../../configs/Contexts";
import * as Firebase from "../../utils/firebase";
import PDFViewer from "../../components/PDFViewer";
import SearchableSelect from "../../components/SearchableSelect";
import ChatModal from "../../components/ChatModal";
import Pagination from "../../components/Pagination";
import "../../css/CompanyApplications.css";
import { getApiError, getBlobApiError } from "../../utils/apiError";
import {
  getApplicantAvatar,
  onApplicantAvatarError,
} from "../../utils/defaultImages";

const STATUS_OPTIONS = [
  { id: ApplicationStatus.DA_NOP, name: "Đã nộp" },
  { id: ApplicationStatus.DA_DUYET, name: "Đã duyệt" },
  { id: ApplicationStatus.TU_CHOI, name: "Từ chối" },
];

const CompanyApplications = () => {
  const toast = useToast();
  const [user] = useContext(MyUserContext);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  
  const [companyProfile, setCompanyProfile] = useState(null);

  
  const [selectedJobPost, setSelectedJobPost] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [jobPosts, setJobPosts] = useState([]);

  
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showCvModal, setShowCvModal] = useState(false);
  const [currentCvUrl, setCurrentCvUrl] = useState("");

  
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  
  const [unreadMap, setUnreadMap] = useState({});
  const chatListRef = useRef(null);

  useEffect(() => {
    fetchCompanyProfile();
    fetchJobPosts();
  }, []);

  
  useEffect(() => {
    if (!user || user.role !== "nhatuyendung") return;

    let cancelled = false;

    const subscribe = async () => {
      const authResult = await Firebase.ensureFirebaseAuth();
      if (cancelled) return;

      if (!authResult.success) {
        console.error(
          "[CompanyApplications] Firebase auth failed:",
          authResult.error,
        );
        return;
      }

      chatListRef.current = Firebase.getRecruiterChatList(
        user.id,
        (chatList) => {
          if (cancelled) return;
          const map = {};
          chatList.forEach((c) => {
            map[String(c.id)] = c.unreadCount || 0;
          });
          setUnreadMap(map);
        },
      );
    };

    subscribe();

    return () => {
      cancelled = true;
      if (chatListRef.current) {
        Firebase.stopListeningToMessages(chatListRef.current);
        chatListRef.current = null;
      }
    };
  }, [user]);

  useEffect(() => {
    fetchApplications();
  }, [currentPage, selectedJobPost, selectedStatus]);

  const fetchCompanyProfile = async () => {
    try {
      const response = await authApis().get(endpoints["company-profile"]);
      setCompanyProfile(response.data);
    } catch (err) {
      console.error("Error fetching company profile:", err);
    }
  };

  const fetchJobPosts = async () => {
    try {
      const response = await authApis().get(endpoints["company-my-jobs"]);
      setJobPosts(response.data.jobs || []);
    } catch (err) {
      console.error("Error fetching job posts:", err);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError("");

      const params = { page: currentPage };
      if (selectedJobPost) params.job_post_id = selectedJobPost;
      if (selectedStatus) params.status = selectedStatus;

      const response = await authApis().get(endpoints["company-applications"], {
        params,
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

  const fetchApplicationDetail = async (applicationId) => {
    try {
      setDetailLoading(true);
      const response = await authApis().get(
        endpoints["company-application-detail"](applicationId),
      );
      setSelectedApplication(response.data);
    } catch (err) {
      console.error("Error fetching application detail:", err);
      toast.error(getApiError(err, "Không thể tải chi tiết đơn ứng tuyển"));
    } finally {
      setDetailLoading(false);
    }
  };

  const handleViewDetail = (application) => {
    setShowDetailModal(true);
    fetchApplicationDetail(application.id);
  };

  const handleViewCV = (cvUrl) => {
    setCurrentCvUrl(cvUrl);
    setShowCvModal(true);
  };

  const handleOpenChat = (candidate) => {
    setSelectedCandidate(candidate);
    setShowChatModal(true);
  };

  const handleUpdateStatus = async (applicationId, newStatus) => {
    try {
      await authApis().put(
        endpoints["company-application-status"](applicationId),
        { status: newStatus },
      );

      toast.success(
        `Đã ${newStatus === ApplicationStatus.DA_DUYET ? "duyệt" : "từ chối"} đơn ứng tuyển`,
      );
      fetchApplications();
      setShowDetailModal(false);
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error(getApiError(err, "Không thể cập nhật trạng thái"));
    }
  };

  const handleFilterChange = (filterType, value) => {
    setCurrentPage(1); 
    if (filterType === "job") {
      setSelectedJobPost(value);
    } else if (filterType === "status") {
      setSelectedStatus(value);
    }
  };

  const handleExportExcel = async () => {
    try {
      const params = {};
      if (selectedJobPost) params.job_id = selectedJobPost;
      if (selectedStatus) params.status = selectedStatus;

      toast.info("Đang tạo file Excel...");

      const response = await authApis().get(endpoints["export-applications"], {
        params,
        responseType: "blob", 
      });

      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `DanhSach_UngVien_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Xuất file Excel thành công!");
    } catch (err) {
      console.error("Lỗi xuất file:", err);
      toast.error(
        await getBlobApiError(err, "Lỗi khi xuất file Excel. Vui lòng thử lại."),
      );
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case ApplicationStatus.DA_DUYET:
        return "status-badge-approved";
      case ApplicationStatus.TU_CHOI:
        return "status-badge-rejected";
      case ApplicationStatus.DA_NOP:
      default:
        return "status-badge-pending";
    }
  };

  const formatDateOnly = (dateString) => {
    if (!dateString) return "N/A";
    
    return String(dateString).split(" ")[0];
  };

  if (loading && applications.length === 0) {
    return (
      <div className="ca-page">
        <div className="ca-loading">
          <div className="spinner"></div>
          <p>Đang tải danh sách đơn ứng tuyển...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ca-page">
      
      <h1 className="ca-title">Đơn ứng tuyển</h1>

      
      <div className="ca-toolbar">
        <div className="ca-toolbar-filters">
          <SearchableSelect
            label="Vị trí tuyển dụng"
            placeholder="Tất cả công việc"
            options={jobPosts.map((job) => ({ id: job.id, name: job.title }))}
            value={selectedJobPost}
            onChange={(jobId) => handleFilterChange("job", jobId)}
            disabled={false}
          />

          <SearchableSelect
            label="Trạng thái"
            placeholder="Tất cả trạng thái"
            options={STATUS_OPTIONS}
            value={selectedStatus}
            onChange={(status) => handleFilterChange("status", status)}
            disabled={false}
          />
        </div>

        <div className="ca-toolbar-actions">
          <button
            className="ca-btn-export"
            onClick={handleExportExcel}
            disabled={loading || applications.length === 0}
            title="Xuất danh sách ra file Excel"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Xuất Excel
          </button>

          <button
            className="ca-btn-search"
            onClick={fetchApplications}
            disabled={loading}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <circle cx="11" cy="11" r="8" strokeWidth="2" />
              <path d="m21 21-4.35-4.35" strokeWidth="2" />
            </svg>
            Tìm kiếm
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      
      {applications.length === 0 ? (
        <div className="ca-empty">
          <svg
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3>
            {selectedJobPost !== "" || selectedStatus !== ""
              ? "Không có đơn nào khớp bộ lọc"
              : "Chưa có đơn ứng tuyển nào"}
          </h3>
          <p>
            {selectedJobPost !== "" || selectedStatus !== ""
              ? "Thử bỏ bộ lọc để xem toàn bộ đơn ứng tuyển"
              : "Các đơn ứng tuyển từ ứng viên sẽ hiển thị ở đây"}
          </p>
        </div>
      ) : (
        <>
          <div className="ca-list">
            {applications.map((app) => (
              <div key={app.id} className="ca-row">
                <img
                  src={getApplicantAvatar(app.candidate.avatar_url)}
                  alt={app.candidate.full_name}
                  className="ca-avatar"
                  onError={onApplicantAvatarError}
                />

                <div className="ca-main">
                  <div className="ca-name-line">
                    <h3 className="ca-name">
                      {app.candidate.full_name || "Chưa cập nhật"}
                    </h3>
                    <span
                      className={`status-badge ${getStatusBadgeClass(app.status)}`}
                    >
                      {app.status}
                    </span>
                  </div>

                  <div className="ca-job">
                    Ứng tuyển: <strong>{app.job_post.title}</strong>
                  </div>

                  <div className="ca-meta">
                    {app.candidate.email && (
                      <span>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                        <a href={`mailto:${app.candidate.email}`}>
                          {app.candidate.email}
                        </a>
                      </span>
                    )}
                    {app.candidate.phone && (
                      <span>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        <a href={`tel:${app.candidate.phone}`}>
                          {app.candidate.phone}
                        </a>
                      </span>
                    )}
                    Nộp ngày {formatDateOnly(app.applied_at)}
                  </div>
                </div>

                <div className="ca-actions">
                  {app.cv_url && (
                    <button
                      className="ca-btn ca-btn-ghost"
                      onClick={() => handleViewCV(app.cv_url)}
                    >
                      Xem CV
                    </button>
                  )}

                  <button
                    className="ca-btn ca-btn-primary"
                    onClick={() => handleViewDetail(app)}
                  >
                    Chi tiết
                  </button>

                  <button
                    className="ca-btn ca-btn-chat"
                    onClick={() => handleOpenChat(app.candidate)}
                    title="Nhắn tin với ứng viên"
                  >
                    Nhắn tin
                    {(unreadMap[String(app.candidate?.id)] || 0) > 0 && (
                      <span className="ca-btn-chat-badge">
                        {unreadMap[String(app.candidate.id)] > 99
                          ? "99+"
                          : unreadMap[String(app.candidate.id)]}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            disabled={loading}
          />
        </>
      )}

      
      {showCvModal && (
        <div className="modal-overlay" onClick={() => setShowCvModal(false)}>
          <div
            className="modal-content modal-cv"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Xem CV</h2>
              <div className="modal-header-actions">
                <a
                  href={currentCvUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-download-cv"
                  title="Mở trong tab mới"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
                <button
                  className="modal-close"
                  onClick={() => setShowCvModal(false)}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="cv-viewer-container">
              <PDFViewer pdfUrl={currentCvUrl} />
            </div>
          </div>
        </div>
      )}

      
      {showDetailModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className="modal-content modal-large ad-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header ad-header">
              <h2>Chi tiết đơn ứng tuyển</h2>

              <div className="ad-header-right">
                {selectedApplication && !detailLoading && (
                  <div className="ad-status-block">
                    <span
                      className={`ad-status ${getStatusBadgeClass(selectedApplication.status)}`}
                    >
                      <span className="ad-status-dot"></span>
                      {selectedApplication.status}
                    </span>
                    <span className="ad-status-date">
                      Nộp ngày {formatDateOnly(selectedApplication.applied_at)}
                    </span>
                  </div>
                )}

                <button
                  className="modal-close"
                  onClick={() => setShowDetailModal(false)}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {detailLoading ? (
              <div className="modal-loading">
                <div className="spinner"></div>
                <p>Đang tải...</p>
              </div>
            ) : selectedApplication ? (
              <div className="modal-body ad-body">
                
                <div className="ad-hero">
                  <img
                    src={getApplicantAvatar(
                      selectedApplication.candidate.avatar_url
                    )}
                    alt={selectedApplication.candidate.full_name}
                    className="ad-hero-avatar"
                    onError={onApplicantAvatarError}
                  />

                  <div className="ad-hero-info">
                    <h3 className="ad-hero-name">
                      {selectedApplication.candidate.full_name ||
                        "Chưa cập nhật"}
                    </h3>

                    <div className="ad-hero-contact">
                      <a
                        href={`mailto:${selectedApplication.candidate.email}`}
                        className="ad-chip"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                        {selectedApplication.candidate.email}
                      </a>

                      {selectedApplication.candidate.phone && (
                        <a
                          href={`tel:${selectedApplication.candidate.phone}`}
                          className="ad-chip"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                          {selectedApplication.candidate.phone}
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                
                <div className="ad-columns">
                  <div className="ad-col">
                    <div className="ad-field">
                      <span className="ad-item-label">Ngày sinh</span>
                      <span className="ad-item-value">
                        {selectedApplication.candidate.date_of_birth || "—"}
                      </span>
                    </div>
                    <div className="ad-field">
                      <span className="ad-item-label">Giới tính</span>
                      <span className="ad-item-value">
                        {selectedApplication.candidate.gender || "—"}
                      </span>
                    </div>
                    <div className="ad-field">
                      <span className="ad-item-label">Địa chỉ</span>
                      <span className="ad-item-value">
                        {selectedApplication.candidate.address || "—"}
                      </span>
                    </div>
                  </div>

                  
                  <div className="ad-col ad-job">
                    <span className="ad-item-label">Vị trí ứng tuyển</span>
                    <h4 className="ad-job-title">
                      {selectedApplication.job_post.title}
                    </h4>
                    <div className="ad-job-meta">
                      {(selectedApplication.job_post.min_salary ||
                        selectedApplication.job_post.max_salary) && (
                        <div className="ad-field">
                          <span className="ad-item-label">Lương</span>
                          <span className="ad-item-value ad-item-value-salary">
                            {selectedApplication.job_post.min_salary?.toLocaleString()}{" "}
                            -{" "}
                            {selectedApplication.job_post.max_salary?.toLocaleString()}{" "}
                            VNĐ
                          </span>
                        </div>
                      )}
                      <div className="ad-field">
                        <span className="ad-item-label">Hạn nộp</span>
                        <span className="ad-item-value">
                          {selectedApplication.job_post.deadline}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedApplication.candidate.description && (
                  <fieldset className="ad-about">
                    <legend className="ad-item-label">Giới thiệu</legend>
                    <p>{selectedApplication.candidate.description}</p>
                  </fieldset>
                )}
              </div>
            ) : null}

            
            {!detailLoading &&
              selectedApplication &&
              selectedApplication.status === ApplicationStatus.DA_NOP && (
                <div className="ad-footer">
                  <button
                    className="btn-reject"
                    onClick={() =>
                      handleUpdateStatus(
                        selectedApplication.id,
                        ApplicationStatus.TU_CHOI,
                      )
                    }
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    Từ chối
                  </button>
                  <button
                    className="btn-approve"
                    onClick={() =>
                      handleUpdateStatus(
                        selectedApplication.id,
                        ApplicationStatus.DA_DUYET,
                      )
                    }
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    Duyệt đơn
                  </button>
                </div>
              )}
          </div>
        </div>
      )}

      
      {showChatModal && selectedCandidate && companyProfile && (
        <ChatModal
          isOpen={showChatModal}
          onClose={() => setShowChatModal(false)}
          otherUserId={selectedCandidate.id}
          otherUserName={selectedCandidate.full_name || selectedCandidate.email}
          otherUserAvatar={selectedCandidate.avatar_url}
          otherUserRole="ungvien"
          companyName={companyProfile.company_name}
          companyId={companyProfile.user_id}
        />
      )}
    </div>
  );
};

export default CompanyApplications;
