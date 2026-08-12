import { useState, useEffect, useCallback, useRef } from "react";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import { useToast } from "../../components/Toast";
import Pagination from "../../components/Pagination";
import { PostStatus } from "../../configs/constants";
import "../../css/AdminUsers.css";
import "../../css/AdminCompanies.css";
import { getApiError } from "../../utils/apiError";

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: PostStatus.HOAT_DONG, label: "Hoạt động" },
  { value: PostStatus.HET_HAN, label: "Hết hạn" },
  { value: PostStatus.AN, label: "Ẩn" },
];

const STATUS_CLASS = {
  [PostStatus.HOAT_DONG]: "au-status-approved",
  [PostStatus.HET_HAN]: "au-status-pending",
  [PostStatus.AN]: "au-status-rejected",
};

const AdminJobs = () => {
  const toast = useToast();

  
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const statusDropdownRef = useRef(null);
  const debounceTimerRef = useRef(null);

  
  const [showChangeStatusMenu, setShowChangeStatusMenu] = useState(false);
  const changeStatusDropdownRef = useRef(null);

  
  const [locations, setLocations] = useState([]);
  const [jobTypes, setJobTypes] = useState([]);

  
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  
  const [processing, setProcessing] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await authApis().get(endpoints["admin-jobs"], {
        params: {
          page: currentPage,
          status: statusFilter || undefined,
          keyword: keyword || undefined,
        },
      });

      setJobs(response.data.jobs || []);
      setTotalPages(response.data.pagination?.total_pages || 1);
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setError(
        getApiError(err, "Không thể tải danh sách bài đăng. Vui lòng thử lại sau."),
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, keyword]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [locRes, typeRes] = await Promise.all([
          Apis.get(endpoints.locations),
          Apis.get(endpoints["job-types"]),
        ]);
        setLocations(locRes.data.locations || []);
        setJobTypes(typeRes.data.job_types || []);
      } catch (err) {
        console.error("Error loading options:", err);
      }
    };

    loadOptions();
  }, []);

  
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const value = keywordInput.trim();

      if (value === keyword) return;

      setCurrentPage(1);
      setKeyword(value);
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [keywordInput, keyword]);

  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target)
      ) {
        setShowStatusMenu(false);
      }

      if (
        changeStatusDropdownRef.current &&
        !changeStatusDropdownRef.current.contains(event.target)
      ) {
        setShowChangeStatusMenu(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowStatusMenu(false);
        setShowChangeStatusMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setCurrentPage(1);
    setKeyword(keywordInput.trim());
  };

  const handleStatusFilterChange = (value) => {
    setCurrentPage(1);
    setStatusFilter(value);
  };

  
  const openDetail = async (jobId, startInEditMode = false) => {
    setShowDetailModal(true);
    setEditMode(startInEditMode);
    setDetail(null);

    try {
      setDetailLoading(true);
      const response = await authApis().get(
        endpoints["admin-job-detail"](jobId),
      );
      setDetail(response.data);
      setForm(buildForm(response.data));
    } catch (err) {
      console.error("Error fetching job detail:", err);
      toast.error(
        getApiError(err, "Không thể tải chi tiết bài đăng"),
      );
      setShowDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const buildForm = (data) => ({
    title: data.title || "",
    min_salary: data.min_salary ?? "",
    max_salary: data.max_salary ?? "",
    deadline: data.deadline || "",
    location_id: data.location_id ?? "",
    job_type_id: data.job_type_id ?? "",
    description: data.description || "",
    requirements: data.requirements || "",
    benefits: data.benefits || "",
  });

  const closeDetail = () => {
    setShowDetailModal(false);
    setDetail(null);
    setEditMode(false);
    setForm({});
    setShowChangeStatusMenu(false);
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      const response = await authApis().put(
        endpoints["admin-job-detail"](detail.id),
        {
          ...form,
          location_id: form.location_id ? Number(form.location_id) : undefined,
          job_type_id: form.job_type_id ? Number(form.job_type_id) : undefined,
        },
      );

      toast.success(response.data.message || "Cập nhật thành công");
      setDetail(response.data.job);
      setForm(buildForm(response.data.job));
      setEditMode(false);
      fetchJobs();
    } catch (err) {
      console.error("Error updating job:", err);
      toast.error(getApiError(err, "Cập nhật thất bại"));
    } finally {
      setSaving(false);
    }
  };

  
  const handleChangeStatus = async (job, status) => {
    try {
      setProcessing(true);
      const response = await authApis().put(
        endpoints["admin-job-status"](job.id),
        { status },
      );

      toast.success(response.data.message || "Đã đổi trạng thái bài đăng");

      if (showDetailModal && detail && detail.id === job.id) {
        setDetail(response.data.job);
      }

      fetchJobs();
    } catch (err) {
      console.error("Error updating job status:", err);
      toast.error(getApiError(err, "Không thể đổi trạng thái"));
    } finally {
      setProcessing(false);
    }
  };

  
  const handleDelete = async () => {
    if (!jobToDelete) return;

    try {
      setDeleting(true);
      await authApis().delete(endpoints["admin-job-detail"](jobToDelete.id));

      toast.success(`Đã xóa bài đăng "${jobToDelete.title}"`);
      setJobToDelete(null);

      if (jobs.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        fetchJobs();
      }
    } catch (err) {
      console.error("Error deleting job:", err);
      toast.error(getApiError(err, "Không thể xóa bài đăng"));
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString("vi-VN");
  };

  const displayValue = (value) => {
    if (value === null || value === undefined || value === "") return "—";
    return value;
  };

  const formatSalary = (min, max) => {
    const toTrieu = (v) => `${(v / 1000000).toFixed(0)} triệu`;
    if (min && max) return `${toTrieu(min)} - ${toTrieu(max)}`;
    if (min) return `Từ ${toTrieu(min)}`;
    if (max) return `Đến ${toTrieu(max)}`;
    return "Thỏa thuận";
  };

  const renderStatusBadge = (status) => (
    <span className={`au-role-badge ${STATUS_CLASS[status] || ""}`}>
      {status || "—"}
    </span>
  );

  const buildDetailRows = (data) => [
    ["ID", data.id],
    ["Công ty", data.company_name],
    ["Địa điểm", data.location_name],
    ["Loại công việc", data.job_type_name],
    ["Mức lương", formatSalary(data.min_salary, data.max_salary)],
    ["Hạn nộp", data.deadline ? formatDate(data.deadline) : null],
    ["Ngày đăng", data.created_at ? formatDate(data.created_at) : null],
    ["Trạng thái", data.status],
    ["Số đơn ứng tuyển", data.application_count],
    ["Lượt lưu", data.saved_count],
    ["Mô tả", data.description],
    ["Yêu cầu", data.requirements],
    ["Quyền lợi", data.benefits],
  ];

  
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
  };


  if (loading && jobs.length === 0) {
    return (
      <div className="au-page">
        <div className="au-loading">
          <div className="au-spinner"></div>
          <p>Đang tải danh sách bài đăng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="au-page">
      <div className="au-header">
        <h1 className="au-title">Quản lý bài đăng tuyển dụng</h1>
      </div>

      
      <form className="au-toolbar" onSubmit={handleSearch}>
        <div className="au-search">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            placeholder="Tìm theo tiêu đề, mô tả, tên công ty..."
          />
        </div>

        <div className="au-dropdown" ref={statusDropdownRef}>
          <button
            type="button"
            className={`au-dropdown-toggle ${showStatusMenu ? "open" : ""}`}
            onClick={() => setShowStatusMenu(!showStatusMenu)}
          >
            <span>
              {STATUS_OPTIONS.find((opt) => opt.value === statusFilter)?.label}
            </span>
            <svg
              className={`au-dropdown-arrow ${showStatusMenu ? "open" : ""}`}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <polyline
                points="6 9 12 15 18 9"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {showStatusMenu && (
            <div className="au-dropdown-menu">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value || "all"}
                  type="button"
                  className={`au-dropdown-item ${
                    statusFilter === opt.value ? "active" : ""
                  }`}
                  onClick={() => {
                    handleStatusFilterChange(opt.value);
                    setShowStatusMenu(false);
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button type="submit" className="au-btn au-btn-primary">
          Tìm kiếm
        </button>
      </form>

      {error && <div className="alert alert-error">{error}</div>}

      
      {jobs.length === 0 ? (
        <div className="au-empty">
          <h3>
            {keyword !== "" || statusFilter !== ""
              ? "Không tìm thấy bài đăng phù hợp"
              : "Chưa có bài đăng nào"}
          </h3>
          <p>
            {keyword !== "" || statusFilter !== ""
              ? "Thử đổi từ khóa hoặc bỏ bộ lọc"
              : "Bài đăng của nhà tuyển dụng sẽ hiển thị ở đây"}
          </p>
        </div>
      ) : (
        <>
          <div className="au-table-wrapper">
            <table className="au-table">
              <thead>
                <tr>
                  <th>Bài đăng</th>
                  <th>Địa điểm</th>
                  <th>Trạng thái</th>
                  <th>Hạn nộp</th>
                  <th>Ngày đăng</th>
                  <th className="au-col-actions">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <div className="au-job-title-cell">
                        <span className="au-username">{job.title}</span>
                        <span className="au-job-company">
                          {job.company_name}
                        </span>
                      </div>
                    </td>
                    <td>{displayValue(job.location_name)}</td>
                    <td>{renderStatusBadge(job.status)}</td>
                    <td>{formatDate(job.deadline)}</td>
                    <td>{formatDate(job.created_at)}</td>
                    <td className="au-col-actions">
                      <button
                        className="au-btn au-btn-ghost"
                        onClick={() => openDetail(job.id)}
                      >
                        Chi tiết
                      </button>
                      <button
                        className="au-btn au-btn-primary"
                        onClick={() => openDetail(job.id, true)}
                      >
                        Sửa
                      </button>
                      <button
                        className="au-btn au-btn-danger"
                        onClick={() => setJobToDelete(job)}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            disabled={loading}
          />
        </>
      )}

      
      {showDetailModal && (
        <div className="au-modal-overlay" onClick={closeDetail}>
          <div className="au-modal" onClick={(e) => e.stopPropagation()}>
            <div className="au-modal-header">
              <h2>{editMode ? "Chỉnh sửa bài đăng" : "Chi tiết bài đăng"}</h2>
              <button
                className="au-modal-close"
                onClick={closeDetail}
                aria-label="Đóng"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="au-modal-body">
              {detailLoading || !detail ? (
                <div className="au-loading">
                  <div className="au-spinner"></div>
                  <p>Đang tải...</p>
                </div>
              ) : editMode ? (
                <form onSubmit={handleSave} className="au-form">
                  <div className="au-form-note">
                    Công ty: <strong>{detail.company_name}</strong>
                  </div>

                  <div className="form-group">
                    <label>Tiêu đề</label>
                    <input
                      className="form-control"
                      name="title"
                      value={form.title}
                      onChange={handleFormChange}
                    />
                  </div>

                  <div className="au-form-row">
                    <div className="form-group">
                      <label>Lương tối thiểu (VNĐ)</label>
                      <input
                        className="form-control"
                        type="number"
                        name="min_salary"
                        value={form.min_salary}
                        onChange={handleFormChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Lương tối đa (VNĐ)</label>
                      <input
                        className="form-control"
                        type="number"
                        name="max_salary"
                        value={form.max_salary}
                        onChange={handleFormChange}
                      />
                    </div>
                  </div>

                  <div className="au-form-row">
                    <div className="form-group">
                      <label>Địa điểm</label>
                      <select
                        className="form-control"
                        name="location_id"
                        value={form.location_id}
                        onChange={handleFormChange}
                      >
                        <option value="">-- Chọn địa điểm --</option>
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Loại công việc</label>
                      <select
                        className="form-control"
                        name="job_type_id"
                        value={form.job_type_id}
                        onChange={handleFormChange}
                      >
                        <option value="">-- Chọn loại --</option>
                        {jobTypes.map((jt) => (
                          <option key={jt.id} value={jt.id}>
                            {jt.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Hạn nộp hồ sơ</label>
                    <input
                      className="form-control"
                      type="date"
                      name="deadline"
                      value={form.deadline}
                      onChange={handleFormChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Mô tả công việc</label>
                    <textarea
                      className="form-control"
                      name="description"
                      rows="4"
                      value={form.description}
                      onChange={handleFormChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Yêu cầu ứng viên</label>
                    <textarea
                      className="form-control"
                      name="requirements"
                      rows="4"
                      value={form.requirements}
                      onChange={handleFormChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Quyền lợi</label>
                    <textarea
                      className="form-control"
                      name="benefits"
                      rows="4"
                      value={form.benefits}
                      onChange={handleFormChange}
                    />
                  </div>

                  <div className="au-modal-actions">
                    <button
                      type="button"
                      className="au-btn au-btn-ghost"
                      onClick={() => {
                        setEditMode(false);
                        setForm(buildForm(detail));
                      }}
                      disabled={saving}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="au-btn au-btn-primary"
                      disabled={saving}
                    >
                      {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="au-detail-head">
                    <div className="au-detail-identity">
                      <div className="au-detail-name-line">
                        <h3>{detail.title}</h3>
                        {renderStatusBadge(detail.status)}
                      </div>
                      <p>{detail.company_name}</p>
                    </div>
                  </div>

                  
                  <div className="au-status-actions">
                    <span className="au-status-label">Đổi trạng thái:</span>

                    <div className="au-dropdown" ref={changeStatusDropdownRef}>
                      <button
                        type="button"
                        className={`au-dropdown-toggle ${
                          showChangeStatusMenu ? "open" : ""
                        }`}
                        onClick={() =>
                          setShowChangeStatusMenu(!showChangeStatusMenu)
                        }
                        disabled={processing}
                      >
                        <span>
                          {STATUS_OPTIONS.find(
                            (opt) => opt.value === detail.status,
                          )?.label || detail.status}
                        </span>
                        <svg
                          className={`au-dropdown-arrow ${
                            showChangeStatusMenu ? "open" : ""
                          }`}
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <polyline
                            points="6 9 12 15 18 9"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>

                      {showChangeStatusMenu && (
                        <div className="au-dropdown-menu">
                          {STATUS_OPTIONS.filter((opt) => opt.value).map(
                            (opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                className={`au-dropdown-item ${
                                  detail.status === opt.value ? "active" : ""
                                }`}
                                onClick={() => {
                                  setShowChangeStatusMenu(false);
                                  if (detail.status !== opt.value) {
                                    handleChangeStatus(detail, opt.value);
                                  }
                                }}
                              >
                                {opt.label}
                              </button>
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <dl className="au-detail-list">
                    {buildDetailRows(detail).map(([label, value]) => (
                      <div className="au-detail-row" key={label}>
                        <dt>{label}</dt>
                        <dd>{displayValue(value)}</dd>
                      </div>
                    ))}
                  </dl>

                  <div className="au-modal-actions">
                    <button
                      className="au-btn au-btn-danger"
                      onClick={() => {
                        setJobToDelete(detail);
                        closeDetail();
                      }}
                    >
                      Xóa bài đăng
                    </button>
                    <button
                      className="au-btn au-btn-primary"
                      onClick={() => setEditMode(true)}
                    >
                      Chỉnh sửa
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      
      {jobToDelete && (
        <div className="au-modal-overlay" onClick={() => setJobToDelete(null)}>
          <div className="au-confirm" onClick={(e) => e.stopPropagation()}>
            <h2>Xác nhận xóa</h2>
            <p>
              Bạn có chắc muốn xóa bài đăng <strong>{jobToDelete.title}</strong>
              ? Toàn bộ đơn ứng tuyển và lượt lưu của bài đăng này sẽ bị xóa
              theo, không thể khôi phục.
            </p>
            <div className="au-modal-actions">
              <button
                className="au-btn au-btn-ghost"
                onClick={() => setJobToDelete(null)}
                disabled={deleting}
              >
                Hủy
              </button>
              <button
                className="au-btn au-btn-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminJobs;
