import { useState, useEffect, useCallback, useRef } from "react";
import { authApis, endpoints } from "../../configs/Apis";
import { useToast } from "../../components/Toast";
import Pagination from "../../components/Pagination";
import { UserRole, Gender } from "../../configs/constants";
import "../../css/AdminUsers.css";
import { getApiError } from "../../utils/apiError";
import {
  getAvatarByRole,
  onApplicantAvatarError,
  onCompanyLogoError,
} from "../../utils/defaultImages";

const ROLE_LABELS = {
  [UserRole.UNGVIEN]: "Ứng viên",
  [UserRole.NHATUYENDUNG]: "Nhà tuyển dụng",
};

const ROLE_OPTIONS = [
  { value: "", label: "Tất cả vai trò" },
  { value: UserRole.UNGVIEN, label: "Ứng viên" },
  { value: UserRole.NHATUYENDUNG, label: "Nhà tuyển dụng" },
];

const AdminUsers = () => {
  const toast = useToast();

  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const roleDropdownRef = useRef(null);
  const debounceTimerRef = useRef(null);

  
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      
      const response = await authApis().get(endpoints["admin-users"], {
        params: {
          page: currentPage,
          role: roleFilter || undefined,
          keyword: keyword || undefined,
        },
      });

      setUsers(response.data.users || []);
      setTotalPages(response.data.pagination?.total_pages || 1);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(
        getApiError(err, "Không thể tải danh sách người dùng. Vui lòng thử lại sau."),
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage, roleFilter, keyword]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  
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
        roleDropdownRef.current &&
        !roleDropdownRef.current.contains(event.target)
      ) {
        setShowRoleMenu(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowRoleMenu(false);
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

  const handleRoleChange = (value) => {
    setCurrentPage(1);
    setRoleFilter(value);
  };

  
  const openDetail = async (userId, startInEditMode = false) => {
    setShowDetailModal(true);
    setEditMode(startInEditMode);
    setDetail(null);

    try {
      setDetailLoading(true);
      const response = await authApis().get(
        endpoints["admin-user-detail"](userId),
      );
      setDetail(response.data);
      setForm(buildForm(response.data));
    } catch (err) {
      console.error("Error fetching user detail:", err);
      toast.error(
        getApiError(err, "Không thể tải thông tin người dùng"),
      );
      setShowDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const buildForm = (data) => {
    if (data.role === UserRole.NHATUYENDUNG) {
      return {
        company_name: data.company_name || "",
        industry: data.industry || "",
        company_size: data.company_size ?? "",
        website: data.website || "",
        address: data.address || "",
        description: data.description || "",
      };
    }

    return {
      full_name: data.full_name || "",
      gender: data.gender || Gender.KHAC,
      date_of_birth: data.date_of_birth || "",
      phone: data.phone || "",
      address: data.address || "",
      description: data.description || "",
    };
  };

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
        endpoints["admin-user-profile"](detail.id),
        form,
      );

      toast.success(response.data.message || "Cập nhật thành công");
      setDetail(response.data.user);
      setForm(buildForm(response.data.user));
      setEditMode(false);
      fetchUsers();
    } catch (err) {
      console.error("Error updating user profile:", err);
      toast.error(getApiError(err, "Cập nhật thất bại"));
    } finally {
      setSaving(false);
    }
  };

  
  const handleDelete = async () => {
    if (!userToDelete) return;

    try {
      setDeleting(true);
      await authApis().delete(endpoints["admin-user-detail"](userToDelete.id));

      toast.success(`Đã xóa tài khoản "${userToDelete.username}"`);
      setUserToDelete(null);

      
      if (users.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        fetchUsers();
      }
    } catch (err) {
      console.error("Error deleting user:", err);
      toast.error(getApiError(err, "Không thể xóa người dùng"));
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

  
  const getDisplayName = (data) => {
    const name =
      data.role === UserRole.NHATUYENDUNG ? data.company_name : data.full_name;
    return name || data.username;
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  
  const buildDetailRows = (data) => {
    const rows = [
      ["ID", data.id],
      ["Tên đăng nhập", data.username],
      ["Email", data.email],
      ["Ngày tạo", data.created_at ? formatDate(data.created_at) : null],
    ];

    if (data.role === UserRole.NHATUYENDUNG) {
      rows.push(
        ["Tên công ty", data.company_name],
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
        ["Trạng thái duyệt", data.status],
      );
    } else {
      rows.push(
        ["Họ và tên", data.full_name],
        ["Giới tính", data.gender],
        [
          "Ngày sinh",
          data.date_of_birth ? formatDate(data.date_of_birth) : null,
        ],
        ["Số điện thoại", data.phone],
      );
    }

    rows.push(["Địa chỉ", data.address], ["Mô tả", data.description]);

    return rows;
  };

  
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
  };


  if (loading && users.length === 0) {
    return (
      <div className="au-page">
        <div className="au-loading">
          <div className="au-spinner"></div>
          <p>Đang tải danh sách người dùng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="au-page">
      <div className="au-header">
        <h1 className="au-title">Quản lý tài khoản người dùng</h1>
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
            placeholder="Tìm theo tên đăng nhập hoặc email..."
          />
        </div>

        <div className="au-dropdown" ref={roleDropdownRef}>
          <button
            type="button"
            className={`au-dropdown-toggle ${showRoleMenu ? "open" : ""}`}
            onClick={() => setShowRoleMenu(!showRoleMenu)}
          >
            <span>
              {ROLE_OPTIONS.find((opt) => opt.value === roleFilter)?.label}
            </span>
            <svg
              className={`au-dropdown-arrow ${showRoleMenu ? "open" : ""}`}
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

          {showRoleMenu && (
            <div className="au-dropdown-menu">
              {ROLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value || "all"}
                  type="button"
                  className={`au-dropdown-item ${
                    roleFilter === opt.value ? "active" : ""
                  }`}
                  onClick={() => {
                    handleRoleChange(opt.value);
                    setShowRoleMenu(false);
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

      
      {users.length === 0 ? (
        <div className="au-empty">
          <h3>
            {keyword !== "" || roleFilter !== ""
              ? "Không tìm thấy người dùng phù hợp"
              : "Chưa có người dùng nào"}
          </h3>
          <p>
            {keyword !== "" || roleFilter !== ""
              ? "Thử đổi từ khóa hoặc bỏ bộ lọc"
              : "Các tài khoản đăng ký sẽ hiển thị ở đây"}
          </p>
        </div>
      ) : (
        <>
          <div className="au-table-wrapper">
            <table className="au-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên đăng nhập</th>
                  <th>Email</th>
                  <th>Vai trò</th>
                  <th>Ngày tạo</th>
                  <th className="au-col-actions">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td className="au-username">{u.username}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`au-role-badge au-role-${u.role}`}>
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td>{formatDate(u.created_at)}</td>
                    <td className="au-col-actions">
                      <button
                        className="au-btn au-btn-ghost"
                        onClick={() => openDetail(u.id)}
                      >
                        Chi tiết
                      </button>
                      <button
                        className="au-btn au-btn-primary"
                        onClick={() => openDetail(u.id, true)}
                      >
                        Sửa
                      </button>
                      <button
                        className="au-btn au-btn-danger"
                        onClick={() => setUserToDelete(u)}
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
              <h2>
                {editMode ? "Chỉnh sửa người dùng" : "Chi tiết người dùng"}
              </h2>
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
                    Tài khoản: <strong>{detail.username}</strong> (
                    {ROLE_LABELS[detail.role] || detail.role})
                  </div>

                  {detail.role === UserRole.NHATUYENDUNG ? (
                    <>
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
                    </>
                  ) : (
                    <>
                      <div className="form-group">
                        <label>Họ và tên</label>
                        <input
                          className="form-control"
                          name="full_name"
                          value={form.full_name}
                          onChange={handleFormChange}
                        />
                      </div>
                      <div className="au-form-row">
                        <div className="form-group">
                          <label>Giới tính</label>
                          <select
                            className="form-control"
                            name="gender"
                            value={form.gender}
                            onChange={handleFormChange}
                          >
                            <option value={Gender.NAM}>Nam</option>
                            <option value={Gender.NU}>Nữ</option>
                            <option value={Gender.KHAC}>Khác</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Ngày sinh</label>
                          <input
                            className="form-control"
                            type="date"
                            name="date_of_birth"
                            value={form.date_of_birth}
                            onChange={handleFormChange}
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Số điện thoại</label>
                        <input
                          className="form-control"
                          name="phone"
                          value={form.phone}
                          onChange={handleFormChange}
                          placeholder="10 - 11 chữ số"
                        />
                      </div>
                    </>
                  )}

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
                    {detail.role === UserRole.ADMIN ? (
                      <div className="au-detail-avatar au-detail-avatar-text">
                        {getInitials(getDisplayName(detail))}
                      </div>
                    ) : (
                      <img
                        className="au-detail-avatar"
                        src={getAvatarByRole(
                          detail.avatar_url || detail.logo_url,
                          detail.role
                        )}
                        alt={getDisplayName(detail)}
                        onError={
                          detail.role === UserRole.NHATUYENDUNG
                            ? onCompanyLogoError
                            : onApplicantAvatarError
                        }
                      />
                    )}

                    <div className="au-detail-identity">
                      <div className="au-detail-name-line">
                        <h3>{getDisplayName(detail)}</h3>
                        <span
                          className={`au-role-badge au-role-${detail.role}`}
                        >
                          {ROLE_LABELS[detail.role] || detail.role}
                        </span>
                      </div>
                      <p>{detail.email}</p>
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
                        setUserToDelete(detail);
                        closeDetail();
                      }}
                    >
                      Xóa tài khoản
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

      
      {userToDelete && (
        <div className="au-modal-overlay" onClick={() => setUserToDelete(null)}>
          <div className="au-confirm" onClick={(e) => e.stopPropagation()}>
            <h2>Xác nhận xóa</h2>
            <p>
              Bạn có chắc muốn xóa tài khoản{" "}
              <strong>{userToDelete.username}</strong>? Toàn bộ dữ liệu như hồ
              sơ, đơn ứng tuyển, bài đăng sẽ bị xóa và không thể khôi phục.
            </p>
            <div className="au-modal-actions">
              <button
                className="au-btn au-btn-ghost"
                onClick={() => setUserToDelete(null)}
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

export default AdminUsers;
