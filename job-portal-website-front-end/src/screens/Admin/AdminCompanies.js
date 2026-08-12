import { useState, useEffect, useCallback, useRef } from "react";
import { authApis, endpoints } from "../../configs/Apis";
import { useToast } from "../../components/Toast";
import Pagination from "../../components/Pagination";
import { CompanyStatus } from "../../configs/constants";
import "../../css/AdminUsers.css";
import "../../css/AdminCompanies.css";
import { getApiError } from "../../utils/apiError";
import {
  getCompanyLogo,
  onCompanyLogoError,
} from "../../utils/defaultImages";

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: CompanyStatus.PENDING, label: "Chờ duyệt" },
  { value: CompanyStatus.APPROVED, label: "Đã duyệt" },
  { value: CompanyStatus.REJECT, label: "Đã từ chối" },
];


const STATUS_CLASS = {
  [CompanyStatus.PENDING]: "au-status-pending",
  [CompanyStatus.APPROVED]: "au-status-approved",
  [CompanyStatus.REJECT]: "au-status-rejected",
};

const AdminCompanies = () => {
  const toast = useToast();

  
  const [tab, setTab] = useState("all");
  const [pendingCount, setPendingCount] = useState(0);

  
  const [companies, setCompanies] = useState([]);
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

  
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  
  const [companyToDelete, setCompanyToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [companyToReject, setCompanyToReject] = useState(null);
  const [processing, setProcessing] = useState(false);

  const isPendingTab = tab === "pending";

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      
      const url = isPendingTab
        ? endpoints["admin-companies-pending"]
        : endpoints["admin-companies"];

      const params = isPendingTab
        ? { page: currentPage }
        : {
            page: currentPage,
            status: statusFilter || undefined,
            keyword: keyword || undefined,
          };

      const response = await authApis().get(url, { params });

      setCompanies(response.data.companies || []);
      setTotalPages(response.data.pagination?.total_pages || 1);

      if (isPendingTab) {
        setPendingCount(response.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Error fetching companies:", err);
      setError(
        getApiError(err, "Không thể tải danh sách công ty. Vui lòng thử lại sau."),
      );
    } finally {
      setLoading(false);
    }
  }, [isPendingTab, currentPage, statusFilter, keyword]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  
  const fetchPendingCount = useCallback(async () => {
    try {
      const response = await authApis().get(
        endpoints["admin-companies-pending"],
        { params: { page: 1 } },
      );
      setPendingCount(response.data.pagination?.total || 0);
    } catch (err) {
      console.error("Error fetching pending count:", err);
    }
  }, []);

  useEffect(() => {
    fetchPendingCount();
  }, [fetchPendingCount]);

  
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
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowStatusMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleChangeTab = (nextTab) => {
    if (nextTab === tab) return;

    setTab(nextTab);
    setCurrentPage(1);
    setCompanies([]);
  };

  const handleSearch = (e) => {
    e.preventDefault();

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setCurrentPage(1);
    setKeyword(keywordInput.trim());
  };

  const handleStatusChange = (value) => {
    setCurrentPage(1);
    setStatusFilter(value);
  };

  
  const openDetail = async (companyId, startInEditMode = false) => {
    setShowDetailModal(true);
    setEditMode(startInEditMode);
    setDetail(null);

    try {
      setDetailLoading(true);
      const response = await authApis().get(
        endpoints["admin-company-detail"](companyId),
      );
      setDetail(response.data);
      setForm(buildForm(response.data));
    } catch (err) {
      console.error("Error fetching company detail:", err);
      toast.error(
        getApiError(err, "Không thể tải thông tin công ty"),
      );
      setShowDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const buildForm = (data) => ({
    company_name: data.company_name || "",
    industry: data.industry || "",
    company_size: data.company_size ?? "",
    website: data.website || "",
    address: data.address || "",
    description: data.description || "",
  });

  const closeDetail = () => {
    setShowDetailModal(false);
    setDetail(null);
    setEditMode(false);
    setForm({});
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      const response = await authApis().put(
        endpoints["admin-company-detail"](detail.id),
        form,
      );

      toast.success(response.data.message || "Cập nhật thành công");
      setDetail(response.data.company);
      setForm(buildForm(response.data.company));
      setEditMode(false);
      fetchCompanies();
    } catch (err) {
      console.error("Error updating company:", err);
      toast.error(getApiError(err, "Cập nhật thất bại"));
    } finally {
      setSaving(false);
    }
  };

  
  const handleApprove = async (company) => {
    try {
      setProcessing(true);
      await authApis().put(endpoints["admin-company-approve"](company.id));

      toast.success(`Đã duyệt công ty "${company.company_name}"`);
      refreshAfterStatusChange(company.id);
    } catch (err) {
      console.error("Error approving company:", err);
      toast.error(getApiError(err, "Không thể duyệt công ty"));
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!companyToReject) return;

    try {
      setProcessing(true);
      await authApis().put(
        endpoints["admin-company-reject"](companyToReject.id),
      );

      toast.success(
        companyToReject.status === CompanyStatus.APPROVED
          ? `Đã thu hồi duyệt công ty "${companyToReject.company_name}"`
          : `Đã từ chối công ty "${companyToReject.company_name}"`,
      );
      const rejectedId = companyToReject.id;
      setCompanyToReject(null);
      refreshAfterStatusChange(rejectedId);
    } catch (err) {
      console.error("Error rejecting company:", err);
      toast.error(getApiError(err, "Không thể từ chối công ty"));
    } finally {
      setProcessing(false);
    }
  };

  
  const refreshAfterStatusChange = async (companyId) => {
    fetchPendingCount();

    
    if (isPendingTab && companies.length === 1 && currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    } else {
      fetchCompanies();
    }

    if (showDetailModal && detail && detail.id === companyId) {
      try {
        const response = await authApis().get(
          endpoints["admin-company-detail"](companyId),
        );
        setDetail(response.data);
      } catch (err) {
        console.error("Error reloading company detail:", err);
      }
    }
  };

  
  const handleDelete = async () => {
    if (!companyToDelete) return;

    try {
      setDeleting(true);
      await authApis().delete(
        endpoints["admin-company-detail"](companyToDelete.id),
      );

      toast.success(`Đã xóa công ty "${companyToDelete.company_name}"`);
      setCompanyToDelete(null);
      fetchPendingCount();

      if (companies.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        fetchCompanies();
      }
    } catch (err) {
      console.error("Error deleting company:", err);
      toast.error(getApiError(err, "Không thể xóa công ty"));
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

  const renderStatusBadge = (status) => (
    <span className={`au-role-badge ${STATUS_CLASS[status] || ""}`}>
      {status || "—"}
    </span>
  );

  const buildDetailRows = (data) => [
    ["ID", data.id],
    ["Tên đăng nhập", data.user_info?.username],
    ["Email", data.user_info?.email],
    ["Ngày đăng ký", data.user_info?.created_at ? formatDate(data.user_info.created_at) : null],
    ["Ngành nghề", data.industry],
    ["Quy mô", data.company_size ? `${data.company_size} nhân viên` : null],
    [
      "Website",
      data.website ? (
        <a href={data.website} target="_blank" rel="noopener noreferrer">
          {data.website}
        </a>
      ) : null,
    ],
    ["Trạng thái", data.status],
    ["Ngày duyệt", data.approved_at ? formatDate(data.approved_at) : null],
    ["Địa chỉ", data.address],
    ["Mô tả", data.description],
  ];

  
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
  };


  if (loading && companies.length === 0) {
    return (
      <div className="au-page">
        <div className="au-loading">
          <div className="au-spinner"></div>
          <p>Đang tải danh sách công ty...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="au-page">
      <div className="au-header">
        <h1 className="au-title">Quản lý công ty</h1>
      </div>

      
      <div className="au-tabs">
        <button
          className={`au-tab ${tab === "all" ? "active" : ""}`}
          onClick={() => handleChangeTab("all")}
        >
          Tất cả công ty
        </button>
        <button
          className={`au-tab ${isPendingTab ? "active" : ""}`}
          onClick={() => handleChangeTab("pending")}
        >
          Chờ duyệt
          {pendingCount > 0 && <span className="au-tab-count">{pendingCount}</span>}
        </button>
      </div>

      
      {!isPendingTab && (
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
              placeholder="Tìm theo tên công ty, ngành nghề, email..."
            />
          </div>

          <div className="au-dropdown" ref={statusDropdownRef}>
            <button
              type="button"
              className={`au-dropdown-toggle ${showStatusMenu ? "open" : ""}`}
              onClick={() => setShowStatusMenu(!showStatusMenu)}
            >
              <span>
                {
                  STATUS_OPTIONS.find((opt) => opt.value === statusFilter)
                    ?.label
                }
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
                      handleStatusChange(opt.value);
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
      )}

      {error && <div className="alert alert-error">{error}</div>}

      
      {companies.length === 0 ? (
        <div className="au-empty">
          <h3>
            {isPendingTab
              ? "Không có công ty nào chờ duyệt"
              : keyword !== "" || statusFilter !== ""
                ? "Không tìm thấy công ty phù hợp"
                : "Chưa có công ty nào"}
          </h3>
          <p>
            {isPendingTab
              ? "Các tài khoản nhà tuyển dụng mới đăng ký sẽ xuất hiện ở đây"
              : keyword !== "" || statusFilter !== ""
                ? "Thử đổi từ khóa hoặc bỏ bộ lọc"
                : "Các công ty đăng ký sẽ hiển thị ở đây"}
          </p>
        </div>
      ) : (
        <>
          <div className="au-table-wrapper">
            <table className="au-table">
              <thead>
                <tr>
                  <th>Công ty</th>
                  <th>Ngành nghề</th>
                  <th>Quy mô</th>
                  <th>Trạng thái</th>
                  <th>Ngày đăng ký</th>
                  <th className="au-col-actions">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="au-company-cell">
                        <img
                          className="au-company-logo"
                          src={getCompanyLogo(c.logo_url)}
                          alt={c.company_name}
                          onError={onCompanyLogoError}
                        />
                        <span className="au-username">
                          {c.company_name || "—"}
                        </span>
                      </div>
                    </td>
                    <td>{displayValue(c.industry)}</td>
                    <td>{c.company_size ? c.company_size : "—"}</td>
                    <td>{renderStatusBadge(c.status)}</td>
                    <td>{formatDate(c.created_at)}</td>
                    <td className="au-col-actions">
                      {isPendingTab ? (
                        <>
                          <button
                            className="au-btn au-btn-ghost"
                            onClick={() => openDetail(c.id)}
                          >
                            Chi tiết
                          </button>
                          <button
                            className="au-btn au-btn-primary"
                            onClick={() => handleApprove(c)}
                            disabled={processing}
                          >
                            Duyệt
                          </button>
                          <button
                            className="au-btn au-btn-danger"
                            onClick={() => setCompanyToReject(c)}
                            disabled={processing}
                          >
                            Từ chối
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="au-btn au-btn-ghost"
                            onClick={() => openDetail(c.id)}
                          >
                            Chi tiết
                          </button>
                          <button
                            className="au-btn au-btn-primary"
                            onClick={() => openDetail(c.id, true)}
                          >
                            Sửa
                          </button>
                          <button
                            className="au-btn au-btn-danger"
                            onClick={() => setCompanyToDelete(c)}
                          >
                            Xóa
                          </button>
                        </>
                      )}
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
              <h2>{editMode ? "Chỉnh sửa công ty" : "Chi tiết công ty"}</h2>
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
                    Tài khoản: <strong>{detail.user_info?.username}</strong>
                  </div>

                  <div className="form-group">
                    <label>Tên công ty</label>
                    <input
                      className="form-control"
                      name="company_name"
                      value={form.company_name}
                      onChange={handleFormChange}
                    />
                  </div>

                  <div className="au-form-row">
                    <div className="form-group">
                      <label>Ngành nghề</label>
                      <input
                        className="form-control"
                        name="industry"
                        value={form.industry}
                        onChange={handleFormChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Quy mô (số nhân viên)</label>
                      <input
                        className="form-control"
                        type="number"
                        name="company_size"
                        value={form.company_size}
                        onChange={handleFormChange}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Website</label>
                    <input
                      className="form-control"
                      name="website"
                      value={form.website}
                      onChange={handleFormChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Địa chỉ</label>
                    <input
                      className="form-control"
                      name="address"
                      value={form.address}
                      onChange={handleFormChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Mô tả</label>
                    <textarea
                      className="form-control"
                      name="description"
                      rows="4"
                      value={form.description}
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
                    <img
                      className="au-detail-avatar"
                      src={getCompanyLogo(detail.logo_url)}
                      alt={detail.company_name}
                      onError={onCompanyLogoError}
                    />

                    <div className="au-detail-identity">
                      <div className="au-detail-name-line">
                        <h3>{detail.company_name || "—"}</h3>
                        {renderStatusBadge(detail.status)}
                      </div>
                      <p>{detail.user_info?.email}</p>
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
                        setCompanyToDelete(detail);
                        closeDetail();
                      }}
                    >
                      Xóa công ty
                    </button>

                    {detail.status !== CompanyStatus.REJECT && (
                      <button
                        className="au-btn au-btn-ghost"
                        onClick={() => setCompanyToReject(detail)}
                        disabled={processing}
                      >
                        {detail.status === CompanyStatus.APPROVED
                          ? "Thu hồi duyệt"
                          : "Từ chối"}
                      </button>
                    )}

                    {detail.status !== CompanyStatus.APPROVED && (
                      <button
                        className="au-btn au-btn-primary"
                        onClick={() => handleApprove(detail)}
                        disabled={processing}
                      >
                        Duyệt
                      </button>
                    )}

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

      
      {companyToReject && (
        <div
          className="au-modal-overlay"
          onClick={() => setCompanyToReject(null)}
        >
          <div className="au-confirm" onClick={(e) => e.stopPropagation()}>
            <h2>
              {companyToReject.status === CompanyStatus.APPROVED
                ? "Thu hồi duyệt"
                : "Từ chối công ty"}
            </h2>
            <p>
              {companyToReject.status === CompanyStatus.APPROVED ? (
                <>
                  Thu hồi trạng thái đã duyệt của công ty{" "}
                  <strong>{companyToReject.company_name}</strong>? Tài khoản này
                  sẽ bị chặn đăng tin tuyển dụng cho đến khi được duyệt lại.
                </>
              ) : (
                <>
                  Từ chối công ty{" "}
                  <strong>{companyToReject.company_name}</strong>? Tài khoản này
                  sẽ không thể đăng tin tuyển dụng cho đến khi được duyệt lại.
                </>
              )}
            </p>
            <div className="au-modal-actions">
              <button
                className="au-btn au-btn-ghost"
                onClick={() => setCompanyToReject(null)}
                disabled={processing}
              >
                Hủy
              </button>
              <button
                className="au-btn au-btn-danger"
                onClick={handleReject}
                disabled={processing}
              >
                {processing
                  ? "Đang xử lý..."
                  : companyToReject.status === CompanyStatus.APPROVED
                    ? "Thu hồi"
                    : "Từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}

      
      {companyToDelete && (
        <div
          className="au-modal-overlay"
          onClick={() => setCompanyToDelete(null)}
        >
          <div className="au-confirm" onClick={(e) => e.stopPropagation()}>
            <h2>Xác nhận xóa</h2>
            <p>
              Bạn có chắc muốn xóa công ty{" "}
              <strong>{companyToDelete.company_name}</strong>? Tài khoản nhà
              tuyển dụng cùng toàn bộ bài đăng và đơn ứng tuyển liên quan sẽ bị
              xóa và không thể khôi phục.
            </p>
            <div className="au-modal-actions">
              <button
                className="au-btn au-btn-ghost"
                onClick={() => setCompanyToDelete(null)}
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

export default AdminCompanies;
