import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { authApis, endpoints } from "../configs/Apis";
import PDFViewer from "./PDFViewer";
import Pagination from "./Pagination";
import { getApiError } from "../utils/apiError";
import { formatDate, formatFileSize } from "../utils/formatters";
import { removeDiacritics } from "../utils/text";
import "../css/CVManagement.css";

const CVManagement = () => {
  const [cvList, setCvList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloadingCv, setDownloadingCv] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [cvName, setCvName] = useState("");
  const [editingCvId, setEditingCvId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [selectedCvs, setSelectedCvs] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [previewCv, setPreviewCv] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDebounce, setSearchDebounce] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    if (!previewCv && !showUploadModal && !showDeleteConfirm) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [previewCv, showUploadModal, showDeleteConfirm]);

  useEffect(() => {
    fetchCvList(true);
  }, []);

  useEffect(() => {
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }

    if (!searchQuery.trim()) {
      fetchCvList(false, 1);
      return;
    }

    const timeout = setTimeout(() => {
      fetchCvList(false, 1);
    }, 500);

    setSearchDebounce(timeout);

    return () => {
      if (searchDebounce) clearTimeout(searchDebounce);
    };
  }, [searchQuery]);

  const fetchCvList = async (isInitialLoad = false, page = 1) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setSearching(true);
      }
      setError("");

      const api = authApis();
      const params = { page };

      if (searchQuery.trim()) {
        const normalizedQuery = removeDiacritics(searchQuery.trim());
        params.search = normalizedQuery;
      }

      const response = await api.get(endpoints.cvs, { params });
      const data = response.data;

      if (page > 1 && (data.cvs || []).length === 0 && data.pages >= 1) {
        return fetchCvList(isInitialLoad, data.pages);
      }

      setCvList(data.cvs || []);
      setPagination({
        page: data.current_page,
        total: data.total,
        totalPages: data.pages,
      });
    } catch (err) {
      console.error("Error fetching CV list:", err);
      setError(getApiError(err, "Không thể tải danh sách CV"));
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      } else {
        setSearching(false);
      }
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadFile(file);
    setCvName(file.name.replace(/\.[^/.]+$/, ""));
    setError("");
  };

  const handleUpload = async () => {
    try {
      setUploading(true);
      setError("");
      setSuccess("");

      const api = authApis();
      const formData = new FormData();

      if (uploadFile) {
        formData.append("cv", uploadFile);
      }

      if (cvName.trim()) {
        formData.append("name", cvName.trim());
      }

      await api.post(endpoints.cvs, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess("Upload CV thành công!");
      setShowUploadModal(false);
      setUploadFile(null);
      setCvName("");

      fetchCvList(false, 1);

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error uploading CV:", err);
      setError(getApiError(err));
    } finally {
      setUploading(false);
    }
  };

  const handleStartEdit = (cv) => {
    setEditingCvId(cv.id);
    setEditingName(cv.name || cv.file_name);
  };

  const handleSaveEdit = async (cvId) => {
    try {
      const api = authApis();
      await api.put(endpoints["cv-rename"](cvId), {
        name: editingName.trim(),
      });

      setSuccess("Đổi tên CV thành công!");
      setEditingCvId(null);
      fetchCvList(false, pagination.page);

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error updating CV name:", err);
      setError(getApiError(err));
    }
  };

  const handleCancelEdit = () => {
    setEditingCvId(null);
    setEditingName("");
  };

  const handlePreviewCv = (cv) => {
    if (!cv.cv_url) {
      setError("Kh\u00f4ng t\u00ecm th\u1ea5y file cho CV n\u00e0y");
      return;
    }

    setPreviewCv(cv);
  };

  const handleDownloadCv = async () => {
    if (!previewCv) return;

    try {
      setDownloadingCv(true);
      const response = await authApis().get(endpoints["cv-download"](previewCv.id), {
        responseType: "blob",
      });
      const disposition = response.headers["content-disposition"] || "";
      const encodedName = disposition.match(/filename\*=UTF-8''([^;]+)/i);
      const plainName = disposition.match(/filename="?([^";]+)"?/i);
      const fileName = encodedName
        ? decodeURIComponent(encodedName[1])
        : plainName?.[1] || "CV.pdf";
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");

      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(getApiError(err, "Không thể tải xuống CV"));
    } finally {
      setDownloadingCv(false);
    }
  };

  const handleSelectCv = (cvId) => {
    setSelectedCvs((prev) => {
      if (prev.includes(cvId)) {
        return prev.filter((id) => id !== cvId);
      } else {
        return [...prev, cvId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedCvs.length === cvList.length) {
      setSelectedCvs([]);
    } else {
      setSelectedCvs(cvList.map((cv) => cv.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedCvs.length === 0) return;

    try {
      const api = authApis();
      await api.delete(endpoints["cv-delete-bulk"], {
        data: { cv_ids: selectedCvs },
      });

      setSuccess(`Đã xóa ${selectedCvs.length} CV!`);
      setSelectedCvs([]);
      setShowDeleteConfirm(false);

      fetchCvList(false, pagination.page);

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error deleting CVs:", err);
      setError(getApiError(err));
      setShowDeleteConfirm(false);
      setTimeout(() => setError(""), 3000);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    if (newPage === pagination.page) return;

    setSelectedCvs([]);
    setEditingCvId(null);
    fetchCvList(false, newPage);
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split(".").pop().toLowerCase();
    if (ext === "pdf") {
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ef4444"
        >
          <path
            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
            strokeWidth="2"
          />
          <polyline points="14 2 14 8 20 8" strokeWidth="2" />
          <path d="M9 15h6" strokeWidth="2" />
          <path d="M9 18h6" strokeWidth="2" />
        </svg>
      );
    }
    return (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#3b82f6"
      >
        <path
          d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
          strokeWidth="2"
        />
        <polyline points="14 2 14 8 20 8" strokeWidth="2" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="cv-management">
        <div className="cv-loading">
          <div className="spinner"></div>
          <p>Đang tải danh sách CV...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cv-management">
      <div className="cv-header">
        <div className="cv-header-left">
          <h1 className="cv-title">Quản lý CV</h1>
          <p className="cv-subtitle">
            {pagination.total === 0
              ? searchQuery.trim()
                ? "Không tìm thấy CV"
                : "Chưa có CV nào"
              : `${pagination.total} CV ${searchQuery.trim() ? "tìm thấy" : "đã tải lên"}` +
                (pagination.totalPages > 1
                  ? ` — trang ${pagination.page}/${pagination.totalPages}`
                  : "")}
          </p>
        </div>
        <button
          className="btn-upload-cv-primary"
          onClick={() => setShowUploadModal(true)}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
              strokeWidth="2"
            />
            <polyline points="17 8 12 3 7 8" strokeWidth="2" />
            <line x1="12" y1="3" x2="12" y2="15" strokeWidth="2" />
          </svg>
          Tải CV mới
        </button>
      </div>

      <div className="cv-search-box">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className="search-icon"
        >
          <circle cx="11" cy="11" r="8" strokeWidth="2" />
          <path d="m21 21-4.35-4.35" strokeWidth="2" />
        </svg>
        <input
          type="text"
          placeholder="Tìm kiếm CV theo tên..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="cv-search-input"
        />
        {searching && (
          <div className="search-loading">
            <svg
              className="search-spinner"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeWidth="2" />
            </svg>
          </div>
        )}
        {searchQuery && !searching && (
          <button
            className="search-clear"
            onClick={() => setSearchQuery("")}
            title="Xóa tìm kiếm"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" />
              <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" />
            </svg>
          </button>
        )}
      </div>

      {error && (
        <div className="cv-alert cv-alert-error">
          {error}
          <button className="alert-close" onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="cv-alert cv-alert-success">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeWidth="2" />
            <polyline points="22 4 12 14.01 9 11.01" strokeWidth="2" />
          </svg>
          {success}
          <button className="alert-close" onClick={() => setSuccess("")}>
            ×
          </button>
        </div>
      )}

      {selectedCvs.length > 0 && (
        <div className="cv-bulk-actions">
          <div className="bulk-info">
            <input
              type="checkbox"
              checked={selectedCvs.length === cvList.length}
              onChange={handleSelectAll}
              className="cv-checkbox"
            />
            <span>Đã chọn {selectedCvs.length} CV</span>
          </div>
          <button
            className="btn-delete-bulk"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <polyline points="3 6 5 6 21 6" strokeWidth="2" />
              <path
                d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                strokeWidth="2"
              />
            </svg>
            Xóa đã chọn
          </button>
        </div>
      )}

      {cvList.length === 0 ? (
        <div className="cv-empty-state">
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
          <h3>{searchQuery.trim() ? "Không tìm thấy CV" : "Chưa có CV nào"}</h3>
          <p>
            {searchQuery.trim()
              ? `Không tìm thấy CV nào với từ khóa "${searchQuery}"`
              : "Tải lên CV của bạn để ứng tuyển nhanh hơn và dễ dàng hơn"}
          </p>
          {!searchQuery.trim() && (
            <button
              className="btn-upload-empty"
              onClick={() => setShowUploadModal(true)}
            >
              <span>Tải CV đầu tiên</span>
            </button>
          )}
        </div>
      ) : (
        <div className="cv-grid">
          {cvList.map((cv) => (
            <div
              key={cv.id}
              className={`cv-card ${selectedCvs.includes(cv.id) ? "selected" : ""}`}
            >
              {editingCvId !== cv.id && (
                <div className="cv-card-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedCvs.includes(cv.id)}
                    onChange={() => handleSelectCv(cv.id)}
                    className="cv-checkbox"
                  />
                </div>
              )}

              <div className="cv-card-content">
                {editingCvId === cv.id ? (
                  <div className="cv-edit-form">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="cv-edit-input"
                      autoFocus
                      onKeyPress={(e) => {
                        if (e.key === "Enter") handleSaveEdit(cv.id);
                        if (e.key === "Escape") handleCancelEdit();
                      }}
                    />
                    <div className="cv-edit-actions">
                      <button
                        className="btn-save-edit"
                        onClick={() => handleSaveEdit(cv.id)}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <polyline points="20 6 9 17 4 12" strokeWidth="2" />
                        </svg>
                      </button>
                      <button
                        className="btn-cancel-edit"
                        onClick={handleCancelEdit}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" />
                          <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="cv-card-title">{cv.name || cv.file_name}</h3>
                    <div className="cv-card-meta">
                      <span className="cv-meta-item">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path
                            d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                            strokeWidth="2"
                          />
                        </svg>
                        {formatFileSize(cv.file_size)}
                      </span>
                      <span className="cv-meta-item">
                        <svg
                          width="14"
                          height="14"
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
                          <line
                            x1="3"
                            y1="10"
                            x2="21"
                            y2="10"
                            strokeWidth="2"
                          />
                        </svg>
                        {formatDate(cv.uploaded_at, {
                          dayFirst: true,
                          twoDigit: true,
                        })}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {editingCvId !== cv.id && (
                <div className="cv-card-actions">
                  <button
                    type="button"
                    className="cv-action-btn cv-action-preview"
                    onClick={() => handlePreviewCv(cv)}
                    title="Xem CV"
                    aria-label={`Xem CV ${cv.name || cv.file_name}`}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
                        strokeWidth="2"
                      />
                      <circle cx="12" cy="12" r="3" strokeWidth="2" />
                    </svg>
                  </button>
                  <button
                    className="cv-action-btn cv-action-edit"
                    onClick={() => handleStartEdit(cv)}
                    title="Đổi tên"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                        strokeWidth="2"
                      />
                      <path
                        d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                        strokeWidth="2"
                      />
                    </svg>
                  </button>
                  <button
                    className="cv-action-btn cv-action-delete"
                    onClick={() => {
                      setSelectedCvs([cv.id]);
                      setShowDeleteConfirm(true);
                    }}
                    title="Xóa"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <polyline points="3 6 5 6 21 6" strokeWidth="2" />
                      <path
                        d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                        strokeWidth="2"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
        disabled={searching}
      />

      {previewCv && createPortal(
        <div
          className="modal-overlay cv-preview-overlay"
          onClick={() => setPreviewCv(null)}
        >
          <div
            className="cv-preview-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Xem CV ${previewCv.name || previewCv.file_name}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header cv-preview-header">
              <h2>Xem CV</h2>
              <div className="cv-preview-header-actions">
                <button
                  type="button"
                  className="cv-preview-download-button"
                  onClick={handleDownloadCv}
                  disabled={downloadingCv}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 3v12" />
                    <path d="m7 10 5 5 5-5" />
                    <path d="M5 21h14" />
                  </svg>
                  {downloadingCv ? "Đang tải..." : "Tải xuống"}
                </button>
                <a
                  href={previewCv.cv_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cv-preview-open-link"
                  title="M\u1edf trong tab m\u1edbi"
                  aria-label="M\u1edf CV trong tab m\u1edbi"
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
                  type="button"
                  className="modal-close"
                  onClick={() => setPreviewCv(null)}
                  aria-label="\u0110\u00f3ng xem CV"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" />
                    <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="cv-preview-viewer">
              <PDFViewer pdfUrl={previewCv.cv_url} />
            </div>
          </div>
        </div>,
        document.body,
      )}

      {showUploadModal && createPortal(
        <div
          className="modal-overlay"
          onClick={() => setShowUploadModal(false)}
        >
          <div className="cv-upload-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tải CV mới</h2>
              <button
                className="modal-close"
                onClick={() => setShowUploadModal(false)}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" />
                  <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="upload-zone">
                <input
                  type="file"
                  id="cv-upload-input"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                />
                <label htmlFor="cv-upload-input" className="upload-zone-label">
                  {uploadFile ? (
                    <div className="file-selected-preview">
                      {getFileIcon(uploadFile.name)}
                      <div className="file-info">
                        <div className="file-name">{uploadFile.name}</div>
                        <div className="file-size">
                          {formatFileSize(uploadFile.size)}
                        </div>
                      </div>
                      <button
                        className="btn-remove-file"
                        onClick={(e) => {
                          e.preventDefault();
                          setUploadFile(null);
                          setCvName("");
                        }}
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" />
                          <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="upload-zone-placeholder">
                      <svg
                        width="64"
                        height="64"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#9ca3af"
                      >
                        <path
                          d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                          strokeWidth="2"
                        />
                        <polyline points="17 8 12 3 7 8" strokeWidth="2" />
                        <line x1="12" y1="3" x2="12" y2="15" strokeWidth="2" />
                      </svg>
                      <p className="upload-text">
                        Nhấp để chọn file hoặc kéo thả vào đây
                      </p>
                      <p className="upload-hint">PDF, DOC, DOCX (tối đa 5MB)</p>
                    </div>
                  )}
                </label>
              </div>

              {uploadFile && (
                <div className="cv-name-input-group">
                  <label htmlFor="cv-name-input">Tên gợi nhớ (tùy chọn)</label>
                  <input
                    type="text"
                    id="cv-name-input"
                    value={cvName}
                    onChange={(e) => setCvName(e.target.value)}
                    placeholder="Ví dụ: CV Backend Developer 2024"
                    className="cv-name-input"
                  />
                  <p className="input-hint">
                    Đặt tên để dễ phân biệt khi có nhiều CV
                  </p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn-modal-cancel"
                onClick={() => setShowUploadModal(false)}
              >
                Hủy
              </button>
              <button
                className="btn-modal-submit"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <svg
                      className="spinner-icon"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeWidth="2" />
                    </svg>
                    Đang tải lên...
                  </>
                ) : (
                  <>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                        strokeWidth="2"
                      />
                      <polyline points="17 8 12 3 7 8" strokeWidth="2" />
                      <line x1="12" y1="3" x2="12" y2="15" strokeWidth="2" />
                    </svg>
                    Tải lên
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {showDeleteConfirm && createPortal(
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon"></div>
            <h3>Xác nhận xóa CV</h3>
            <p>
              Bạn có chắc chắn muốn xóa {selectedCvs.length} CV đã chọn?
              <br />
              Hành động này không thể hoàn tác.
            </p>
            <div className="confirm-actions">
              <button
                className="btn-confirm-cancel"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Hủy
              </button>
              <button
                className="btn-confirm-delete"
                onClick={handleDeleteSelected}
              >
                Xóa
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
};

export default CVManagement;
