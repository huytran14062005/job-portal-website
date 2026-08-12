import React, { useState, useEffect } from "react";
import { authApis, endpoints } from "../configs/Apis";
import { getApiError } from "../utils/apiError";
import "../css/ApplyJobModal.css";

const ANALYSIS_LABELS = {
  ky_nang: "Kỹ năng",
  kinh_nghiem: "Kinh nghiệm",
  trach_nhiem: "Trách nhiệm & dự án",
  hoc_van: "Học vấn & chứng chỉ",
  tu_khoa: "Từ khóa chuyên ngành",
};

const AiMatchResult = ({ result }) => {
  const score = result.job_match_score ?? result.score ?? 0;
  const recommendation = typeof result.recommendation === "object"
    ? result.recommendation
    : { decision: result.recommendation || "", reason: result.summary || "" };
  const analysis = result.detailed_analysis || {};
  const list = (value) => (Array.isArray(value) ? value : []);
  const keywordMatch = result.keyword_match || {};
  const keywordSuggestions = list(result.keyword_suggestions).length
    ? list(result.keyword_suggestions)
    : list(keywordMatch.missing);

  return (
    <section className="ai-match-result" aria-label="Kết quả đánh giá CV bằng AI">
      <div className="ai-match-overview">
        <div className="ai-match-score-card">
          <div className="ai-match-score-ring">
            <strong>{score}</strong>
            <span>/100</span>
          </div>
          <div>
            <span className="ai-match-eyebrow">Mức độ phù hợp</span>
            <h4>{result.match_level || "Kết quả phân tích"}</h4>
            <p>Điểm này phản ánh độ phù hợp với công việc, không phải điểm chất lượng tuyệt đối của CV.</p>
          </div>
        </div>
        <div className="ai-match-badges">
          <span className="ai-match-badge"><b>ATS</b>{result.ats_score ?? 0}/100</span>
          <span className="ai-match-badge"><b>Tin cậy</b>{result.confidence ?? 0}%</span>
          <span className="ai-match-badge"><b>Phỏng vấn</b>{result.interview_probability || "Chưa xác định"}</span>
        </div>
      </div>

      <div className="ai-match-recommendation">
        <span className="ai-match-section-kicker">Khuyến nghị</span>
        <strong>{recommendation.decision || "Xem thêm phân tích bên dưới"}</strong>
        <p>{recommendation.reason || "Chưa có lý do cụ thể."}</p>
      </div>

      <div className="ai-match-section">
        <div className="ai-match-section-heading">
          <h5>Phân tích theo tiêu chí</h5>
          <span>Trọng số theo yêu cầu của hệ thống</span>
        </div>
        <div className="ai-match-analysis-grid">
          {Object.entries(ANALYSIS_LABELS).map(([key, label]) => {
            const item = analysis[key] || {};
            return (
              <article className="ai-match-analysis-card" key={key}>
                <div className="ai-match-analysis-title">
                  <strong>{label}</strong>
                  <b>{item.score ?? 0}/100</b>
                </div>
                <div className="ai-match-progress"><span style={{ width: `${Math.min(100, Math.max(0, Number(item.score) || 0))}%` }} /></div>
                <p>{item.reason || "Chưa có đủ bằng chứng trong dữ liệu."}</p>
              </article>
            );
          })}
        </div>
      </div>

      <div className="ai-match-columns">
        <div className="ai-match-section ai-match-list-card ai-match-positive">
          <h5>Đã đáp ứng</h5>
          <ul>{list(result.matched_requirements).map((item, index) => <li key={`matched-${index}`}>{item}</li>)}</ul>
          {!list(result.matched_requirements).length && <span className="ai-match-empty">Chưa xác định.</span>}
        </div>
        <div className="ai-match-section ai-match-list-card ai-match-negative">
          <h5>Còn thiếu</h5>
          <ul>{list(result.missing_requirements || result.missing_skills).map((item, index) => <li key={`missing-${index}`}>{item}</li>)}</ul>
          {!list(result.missing_requirements || result.missing_skills).length && <span className="ai-match-empty">Không phát hiện yêu cầu thiếu rõ ràng.</span>}
        </div>
      </div>

      <div className="ai-match-columns">
        <div className="ai-match-section ai-match-list-card">
          <h5>Điểm mạnh của CV</h5>
          <ul>{list(result.cv_strengths || result.strengths).map((item, index) => <li key={`strength-${index}`}>{item}</li>)}</ul>
        </div>
        <div className="ai-match-section ai-match-list-card ai-match-negative">
          <h5>Lỗ hổng quan trọng</h5>
          <ul>{list(result.critical_gaps).map((item, index) => <li key={`gap-${index}`}>{item}</li>)}</ul>
        </div>
      </div>

      {list(result.priority_improvements).length > 0 && (
        <div className="ai-match-section">
          <div className="ai-match-section-heading">
            <h5>Việc nên ưu tiên cải thiện</h5>
            <span>Tập trung vào các mục có tác động lớn trước</span>
          </div>
          <div className="ai-match-improvements">
            {list(result.priority_improvements).map((item, index) => (
              <div className="ai-match-improvement" key={`improvement-${index}`}>
                <span>{item.priority || "Gợi ý"}</span>
                <div><strong>{item.issue || "Cải thiện CV"}</strong><p>{item.impact || "Có thể giúp CV phù hợp hơn với Job Post."}</p></div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="ai-match-columns ai-match-bottom-sections">
        <div className="ai-match-section ai-match-list-card">
          <h5>Gợi ý chỉnh CV</h5>
          <ul>{list(result.optimization_tips).map((item, index) => <li key={`tip-${index}`}>{item}</li>)}</ul>
        </div>
        <div className="ai-match-section ai-match-list-card">
          <h5>Từ khóa ATS</h5>
          <span className="ai-match-subheading">Đã khớp</span>
          <div className="ai-match-tags ai-match-tags-matched">{list(keywordMatch.matched).map((item, index) => <span key={`matched-keyword-${index}`}>{item}</span>)}</div>
          <span className="ai-match-subheading">Nên bổ sung</span>
          <div className="ai-match-tags">{keywordSuggestions.map((item, index) => <span key={`keyword-${index}`}>{item}</span>)}</div>
          {!list(keywordMatch.matched).length && !keywordSuggestions.length && <span className="ai-match-empty">Chưa có gợi ý từ khóa.</span>}
        </div>
      </div>
    </section>
  );
};

const ApplyJobModal = ({ isOpen, onClose, jobId, jobTitle, companyName, onSuccess }) => {
  const [cvList, setCvList] = useState([]);
  const [selectedCvId, setSelectedCvId] = useState(null);
  const [newCvFile, setNewCvFile] = useState(null);
  const [uploadMode, setUploadMode] = useState("existing"); 
  const [loading, setLoading] = useState(false);
  const [loadingCvs, setLoadingCvs] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [applyInfo, setApplyInfo] = useState(null); 
  const [checkingApplied, setCheckingApplied] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCvList, setFilteredCvList] = useState([]);
  const [matchResult, setMatchResult] = useState(null);
  const [matchingLoading, setMatchingLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkIfAlreadyApplied();
      fetchCvList();
      
      setSelectedCvId(null);
      setNewCvFile(null);
      setUploadMode("existing");
      setError("");
      setSuccess("");
      setSearchQuery("");
      setMatchResult(null);
      setMatchingLoading(false);
    }
  }, [isOpen, jobId]);

  
  useEffect(() => {
    if (!searchQuery.trim()) {
      
      setFilteredCvList(cvList);
    } else {
      
      const query = removeDiacritics(searchQuery.toLowerCase());
      const filtered = cvList.filter((cv) => {
        const name = removeDiacritics((cv.name || "").toLowerCase());
        const fileName = removeDiacritics((cv.file_name || "").toLowerCase());
        return name.includes(query) || fileName.includes(query);
      });
      setFilteredCvList(filtered);
    }
  }, [searchQuery, cvList]); 

  
  const removeDiacritics = (str) => {
    return str
      .normalize("NFD") 
      .replace(/[\u0300-\u036f]/g, "") 
      .replace(/đ/g, "d") 
      .replace(/Đ/g, "D"); 
  };

  const checkIfAlreadyApplied = async () => {
    try {
      setCheckingApplied(true);
      const api = authApis();
      const response = await api.get(endpoints["check-applied"](jobId));
      setApplyInfo(response.data);
    } catch (err) {
      console.error("Error checking applied status:", err);
    } finally {
      setCheckingApplied(false);
    }
  };

  
  const isBlocked = applyInfo && applyInfo.is_applied && !applyInfo.can_reapply;
  const isReapply = applyInfo && applyInfo.can_reapply;

  const fetchCvList = async () => {
    try {
      setLoadingCvs(true);
      const api = authApis();

      
      
      let allCvs = [];
      let page = 1;
      let totalPages = 1;

      do {
        const response = await api.get(endpoints.cvs, { params: { page } });
        allCvs = allCvs.concat(response.data.cvs || []);
        totalPages = response.data.pages || 1;
        page++;
      } while (page <= totalPages);

      setCvList(allCvs);
      setFilteredCvList(allCvs);

      
      if (allCvs.length > 0) {
        setSelectedCvId(allCvs[0].id);
      }
    } catch (err) {
      console.error("Error fetching CV list:", err);
      setError(getApiError(err, "Không thể tải danh sách CV"));
    } finally {
      setLoadingCvs(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    
    
    setNewCvFile(file);
    setError("");
  };

  const handleApply = async () => {
    
    
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const api = authApis();
      const formData = new FormData();

      
      if (uploadMode === "existing" && selectedCvId) {
        formData.append("cv_file_id", selectedCvId);
      } else if (uploadMode === "new" && newCvFile) {
        formData.append("cv", newCvFile);
      }

      const response = await api.post(endpoints["apply-job"](jobId), formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess(response.data.message || "Nộp đơn ứng tuyển thành công!");

      
      if (onSuccess) {
        onSuccess();
      }

      
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Error applying job:", err);
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeCv = async () => {
    
    
    try {
      setMatchingLoading(true);
      setError("");
      const response = await authApis().post(endpoints["ai-cv-match"], {
        job_id: jobId,
        cv_id: selectedCvId,
      });
      setMatchResult(response.data.match);
    } catch (err) {
      console.error("Error analyzing CV:", err);
      setError(getApiError(err));
    } finally {
      setMatchingLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="apply-modal" onClick={(e) => e.stopPropagation()}>
        
        <div className="apply-modal-header">
          <div className="apply-modal-title-section">
            <h2 className="apply-modal-title">Ứng tuyển ngay</h2>
            <div className="apply-modal-job-info">
              <span className="apply-modal-job-title">{jobTitle}</span>
              <span className="apply-modal-company">{companyName}</span>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" />
              <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" />
            </svg>
          </button>
        </div>

        
        <div className="apply-modal-body">
          {checkingApplied ? (
            <div className="checking-status">
              <div className="spinner-small"></div>
              <span>Đang kiểm tra...</span>
            </div>
          ) : isBlocked ? (
            <div className="already-applied-message">
              {applyInfo.status === "từ chối" ? (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444">
                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                  <line x1="15" y1="9" x2="9" y2="15" strokeWidth="2" />
                  <line x1="9" y1="9" x2="15" y2="15" strokeWidth="2" />
                </svg>
              ) : (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeWidth="2" />
                  <polyline points="22 4 12 14.01 9 11.01" strokeWidth="2" />
                </svg>
              )}
              <h3>
                {applyInfo.status === "từ chối"
                  ? "Không thể ứng tuyển lại"
                  : "Bạn đã ứng tuyển vị trí này"}
              </h3>
              <p>{applyInfo.reason}</p>
              {applyInfo.status === "từ chối" && (
                <p className="reapply-quota">
                  Đã nộp {applyInfo.apply_count}/{applyInfo.max_apply_times} lượt
                </p>
              )}
            </div>
          ) : (
            <>
              
              {isReapply && (
                <div className="reapply-banner">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                  </svg>
                  <div className="reapply-banner-content">
                    <span className="reapply-banner-title">
                      Đây là lần nộp thứ {applyInfo.apply_count + 1}/
                      {applyInfo.max_apply_times}
                    </span>
                    <span className="reapply-banner-sub">
                      Đơn trước đã bị từ chối. Bạn còn {applyInfo.attempts_left}{" "}
                      lượt nộp cho công việc này — nên chọn CV đã cập nhật để
                      tăng cơ hội.
                    </span>
                  </div>
                </div>
              )}

              
              {error && (
                <div className="apply-alert apply-alert-error">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                    <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" />
                    <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" />
                  </svg>
                  {error}
                </div>
              )}

              {success && (
                <div className="apply-alert apply-alert-success">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeWidth="2" />
                    <polyline points="22 4 12 14.01 9 11.01" strokeWidth="2" />
                  </svg>
                  {success}
                </div>
              )}

              
              <div className="upload-mode-selector">
                <button
                  className={`mode-btn ${uploadMode === "existing" ? "active" : ""}`}
                  onClick={() => setUploadMode("existing")}
                  disabled={loading}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeWidth="2" />
                    <polyline points="14 2 14 8 20 8" strokeWidth="2" />
                  </svg>
                  Chọn CV có sẵn
                </button>
                <button
                  className={`mode-btn ${uploadMode === "new" ? "active" : ""}`}
                  onClick={() => setUploadMode("new")}
                  disabled={loading}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="2" />
                    <polyline points="17 8 12 3 7 8" strokeWidth="2" />
                    <line x1="12" y1="3" x2="12" y2="15" strokeWidth="2" />
                  </svg>
                  Tải CV mới
                </button>
              </div>

              
              {uploadMode === "existing" && (
                <div className="cv-selection-section">
                  {loadingCvs ? (
                    <div className="loading-cvs">
                      <div className="spinner-small"></div>
                      <span>Đang tải danh sách CV...</span>
                    </div>
                  ) : cvList.length === 0 ? (
                    <div className="no-cv-message">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeWidth="1.5" />
                        <polyline points="14 2 14 8 20 8" strokeWidth="1.5" />
                      </svg>
                      <p>Bạn chưa có CV nào</p>
                      <button
                        className="btn-switch-mode"
                        onClick={() => setUploadMode("new")}
                      >
                        Tải CV mới lên
                      </button>
                    </div>
                  ) : (
                    <>
                      
                      <div className="apply-cv-search-box">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="apply-search-icon">
                          <circle cx="11" cy="11" r="8" strokeWidth="2" />
                          <path d="m21 21-4.35-4.35" strokeWidth="2" />
                        </svg>
                        <input
                          type="text"
                          placeholder="Tìm CV..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="apply-cv-search-input"
                        />
                        {searchQuery && (
                          <button
                            className="apply-search-clear"
                            onClick={() => setSearchQuery("")}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" />
                              <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" />
                            </svg>
                          </button>
                        )}
                      </div>

                      
                      {filteredCvList.length === 0 ? (
                        <div className="no-cv-message">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeWidth="1.5" />
                            <polyline points="14 2 14 8 20 8" strokeWidth="1.5" />
                          </svg>
                          <p>Không tìm thấy CV nào với từ khóa "{searchQuery}"</p>
                          <button
                            className="btn-switch-mode"
                            onClick={() => setSearchQuery("")}
                          >
                            Xóa tìm kiếm
                          </button>
                        </div>
                      ) : (
                        <div className="cv-list-scrollable">
                          {filteredCvList.map((cv) => (
                            <div
                              key={cv.id}
                              className={`cv-item ${selectedCvId === cv.id ? "selected" : ""}`}
                              onClick={() => {
                                setSelectedCvId(cv.id);
                                setMatchResult(null);
                              }}
                            >
                              <div className="cv-item-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeWidth="2" />
                                  <polyline points="14 2 14 8 20 8" strokeWidth="2" />
                                </svg>
                              </div>
                              <div className="cv-item-info">
                                <div className="cv-item-name">
                                  {cv.name || cv.file_name}
                                </div>
                                <div className="cv-item-meta">
                                  <span>{formatFileSize(cv.file_size)}</span>
                                </div>
                              </div>
                              <div className="cv-item-radio">
                                {selectedCvId === cv.id && (
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <polyline points="20 6 9 17 4 12" strokeWidth="2" />
                                  </svg>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="ai-match-actions">
                        <button
                          type="button"
                          className="btn-ai-match"
                          onClick={handleAnalyzeCv}
                          disabled={!selectedCvId || matchingLoading || loading}
                        >
                          {matchingLoading ? (
                            "Đang phân tích..."
                          ) : (
                            <>
                              <span className="ai-sparkle" aria-hidden="true">✨</span>
                              Đánh giá CV bằng AI
                            </>
                          )}
                        </button>
                        <span className="ai-match-hint">
                          AI chỉ hỗ trợ tham khảo, không thay thế quyết định tuyển dụng.
                        </span>
                      </div>

                      {matchResult && <AiMatchResult result={matchResult} />}
                    </>
                  )}
                </div>
              )}

              
              {uploadMode === "new" && (
                <div className="cv-upload-section">
                  <div className="upload-area">
                    <input
                      type="file"
                      id="cv-file-input"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                    />
                    <label htmlFor="cv-file-input" className="upload-label">
                      {newCvFile ? (
                        <div className="file-selected">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeWidth="2" />
                            <polyline points="14 2 14 8 20 8" strokeWidth="2" />
                            <polyline points="9 15 12 12 15 15" strokeWidth="2" />
                            <line x1="12" y1="12" x2="12" y2="19" strokeWidth="2" />
                          </svg>
                          <div className="file-info">
                            <div className="file-name">{newCvFile.name}</div>
                            <div className="file-size">{formatFileSize(newCvFile.size)}</div>
                          </div>
                          <button
                            type="button"
                            className="btn-change-file"
                            onClick={(e) => {
                              e.preventDefault();
                              document.getElementById("cv-file-input").click();
                            }}
                          >
                            Chọn file khác
                          </button>
                        </div>
                      ) : (
                        <div className="upload-placeholder">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="2" />
                            <polyline points="17 8 12 3 7 8" strokeWidth="2" />
                            <line x1="12" y1="3" x2="12" y2="15" strokeWidth="2" />
                          </svg>
                          <div className="upload-text">
                            <span className="upload-main-text">Nhấp để chọn file CV</span>
                            <span className="upload-sub-text">Hỗ trợ: PDF, DOC, DOCX (tối đa 5MB)</span>
                          </div>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        
        {!checkingApplied && !isBlocked && (
          <div className="apply-modal-footer">
            <button
              className="btn-cancel-apply"
              onClick={onClose}
              disabled={loading || matchingLoading}
            >
              Hủy
            </button>
            <button
              className="btn-submit-apply"
              onClick={handleApply}
              disabled={loading || matchingLoading || success !== ""}
            >
              {loading ? (
                <>
                  <svg className="spinner-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeWidth="2" />
                  </svg>
                  Đang gửi...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                  {isReapply ? "Nộp lại đơn ứng tuyển" : "Nộp đơn ứng tuyển"}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplyJobModal;
