import { useState, useEffect } from "react";
import { authApis, endpoints } from "../../configs/Apis";
import { CompanyStatus } from "../../configs/constants";
import { useSocket } from "../../contexts/SocketContext";
import { getApiError } from "../../utils/apiError";
import {
  getCompanyLogo,
  onCompanyLogoError,
} from "../../utils/defaultImages";

const CompanyProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("account");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const { companyStatusUpdate } = useSocket();

  useEffect(() => {
    fetchProfile();
  }, []);

  
  useEffect(() => {
    if (!companyStatusUpdate) return;

    setProfile((prev) =>
      prev
        ? {
            ...prev,
            status: companyStatusUpdate.status,
            approved_at: companyStatusUpdate.approved_at,
          }
        : prev,
    );
  }, [companyStatusUpdate]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await authApis().get(endpoints["company-profile"]);
      setProfile(response.data);
      setFormData(response.data);
    } catch (err) {
      console.error("Error fetching company profile:", err);
      setError(getApiError(err, "Không thể tải thông tin công ty."));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    
    setError("");
  };

  const handleEditMode = () => {
    setIsEditing(true);
    setError("");
    setSuccessMessage("");
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData(profile); 
    setError("");
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    
    
    setLogoFile(file);

    
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);
    setError("");
  };

  const handleSaveProfile = async () => {
    
    
    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      const formDataToSend = new FormData();
      formDataToSend.append("company_name", formData.company_name || "");
      formDataToSend.append("industry", formData.industry || "");
      formDataToSend.append("company_size", formData.company_size ?? "");
      formDataToSend.append("website", formData.website || "");
      formDataToSend.append("address", formData.address || "");
      formDataToSend.append("description", formData.description || "");

      
      if (logoFile) {
        formDataToSend.append("logo", logoFile);
      }

      const api = authApis();
      await api.put(endpoints["company-profile"], formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccessMessage("Cập nhật thông tin công ty thành công!");
      await fetchProfile();
      setIsEditing(false);
      setLogoFile(null);
      setLogoPreview(null);

      
      window.dispatchEvent(new Event("profileUpdated"));

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      console.error("Error updating company profile:", err);
      setError(getApiError(err));
    } finally {
      setSaving(false);
    }
  };

  
  const getRoleInfo = () => {
    return {
      label: "Nhà tuyển dụng",
      className: "role-badge-employer",
      icon: (
        <>
          <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" strokeWidth="2" />
        </>
      ),
    };
  };

  
  const renderApprovalBadge = () => {
    if (profile?.status === CompanyStatus.APPROVED) {
      return (
        <span className="approval-badge approval-badge-approved">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            
            <path
              d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81C14.67 2.62 13.43 1.75 12 1.75s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91C2.62 9.33 1.75 10.57 1.75 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z"
              fill="currentColor"
            />
            <path
              d="m8.2 12.2 2.6 2.6 5-5.4"
              stroke="#fff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Đã duyệt
        </span>
      );
    }

    if (profile?.status === CompanyStatus.REJECT) {
      return (
        <span className="approval-badge approval-badge-rejected">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="currentColor" />
            <path
              d="M8.6 8.6l6.8 6.8M15.4 8.6l-6.8 6.8"
              stroke="#fff"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
          Đã từ chối
        </span>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="modern-profile-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="modern-profile-container">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="profile-layout">
      
      <div className="profile-sidebar">
        <button
          className={`sidebar-item ${activeSection === "account" ? "active" : ""}`}
          onClick={() => setActiveSection("account")}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" strokeWidth="2" />
          </svg>
          <div>
            <div className="sidebar-title">Thông tin công ty</div>
            <div className="sidebar-desc">Tùy chỉnh thông tin công ty</div>
          </div>
        </button>
      </div>

      
      <div className="profile-main">
        {activeSection === "account" && (
          <div className="profile-section">
            <div className="section-header-simple">
              <div>
                <h1 className="section-heading">Thông tin công ty</h1>
              </div>
              {!isEditing && (
                <button className="btn-edit-profile" onClick={handleEditMode}>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Cập nhật thông tin
                </button>
              )}
            </div>

            {successMessage && (
              <div className="alert alert-success">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                {successMessage}
              </div>
            )}

            {error && (
              <div className="alert alert-error">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                {error}
              </div>
            )}

            <div className="profile-content-simple">
              
              <div className="profile-field">
                <label className="profile-label">Logo công ty</label>
                <div className="profile-value">
                  <div className="avatar-section">
                    <div className="avatar-wrapper">
                      <img
                        src={logoPreview || getCompanyLogo(profile?.logo_url)}
                        alt="Company Logo"
                        className="avatar-image"
                        onError={onCompanyLogoError}
                      />
                    </div>

                    
                    <span className={`role-badge ${getRoleInfo().className}`}>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        {getRoleInfo().icon}
                      </svg>
                      {getRoleInfo().label}
                    </span>

                    {isEditing && (
                      <div className="avatar-upload-controls">
                        <input
                          type="file"
                          id="logo-upload"
                          accept="image/*"
                          onChange={handleLogoChange}
                          style={{ display: "none" }}
                        />
                        <label
                          htmlFor="logo-upload"
                          className="btn-upload-avatar"
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
                          Chọn logo
                        </label>
                        <span className="avatar-hint">
                          JPG, PNG (tối đa 5MB)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="profile-divider"></div>

              
              <div className="profile-field">
                <label className="profile-label">
                  Tên công ty <span className="text-required">*</span>
                </label>
                <div className="profile-value">
                  {isEditing ? (
                    <input
                      type="text"
                      className="profile-input"
                      value={formData?.company_name || ""}
                      onChange={(e) =>
                        handleInputChange("company_name", e.target.value)
                      }
                      placeholder="Nhập tên công ty"
                    />
                  ) : (
                    <span className="company-name-line">
                      <span className="profile-text">
                        {profile?.company_name || "Chưa cập nhật"}
                      </span>
                      {renderApprovalBadge()}
                    </span>
                  )}
                </div>
              </div>

              
              <div className="profile-field">
                <label className="profile-label">
                  Email công ty <span className="text-required">*</span>
                </label>
                <div className="profile-value">
                  <span className="profile-text">{profile?.email || ""}</span>
                </div>
              </div>

              
              <div className="profile-field">
                <label className="profile-label">Lĩnh vực</label>
                <div className="profile-value">
                  {isEditing ? (
                    <input
                      type="text"
                      className="profile-input"
                      value={formData?.industry || ""}
                      onChange={(e) =>
                        handleInputChange("industry", e.target.value)
                      }
                      placeholder="VD: Công nghệ thông tin, Giáo dục, ..."
                    />
                  ) : (
                    <span className="profile-text">
                      {profile?.industry || "Chưa cập nhật"}
                    </span>
                  )}
                </div>
              </div>

              
              <div className="profile-field">
                <label className="profile-label">Quy mô công ty</label>
                <div className="profile-value">
                  {isEditing ? (
                    <input
                      type="number"
                      className="profile-input"
                      value={formData?.company_size || ""}
                      onChange={(e) =>
                        handleInputChange("company_size", e.target.value)
                      }
                      placeholder="VD: 500"
                    />
                  ) : (
                    <span className="profile-text">
                      {profile?.company_size ? `${profile.company_size} nhân viên` : "Chưa cập nhật"}
                    </span>
                  )}
                </div>
              </div>

              
              <div className="profile-field">
                <label className="profile-label">Website</label>
                <div className="profile-value">
                  {isEditing ? (
                    <input
                      type="text"
                      className="profile-input"
                      value={formData?.website || ""}
                      onChange={(e) =>
                        handleInputChange("website", e.target.value)
                      }
                      placeholder="https://example.com"
                    />
                  ) : (
                    <span className="profile-text">
                      {profile?.website ? (
                        <a
                          href={profile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link-text"
                        >
                          {profile.website}
                        </a>
                      ) : (
                        "Chưa cập nhật"
                      )}
                    </span>
                  )}
                </div>
              </div>

              
              <div className="profile-field">
                <label className="profile-label">Địa chỉ</label>
                <div className="profile-value">
                  {isEditing ? (
                    <input
                      type="text"
                      className="profile-input"
                      placeholder="Nhập địa chỉ công ty"
                      value={formData?.address || ""}
                      onChange={(e) =>
                        handleInputChange("address", e.target.value)
                      }
                    />
                  ) : (
                    <span className="profile-text">
                      {profile?.address || "Chưa cập nhật"}
                    </span>
                  )}
                </div>
              </div>

              <div className="profile-divider"></div>

              
              <div className="profile-field profile-field-full">
                <label className="profile-label">Giới thiệu công ty</label>
                <div className="profile-value">
                  {isEditing ? (
                    <textarea
                      className="profile-textarea"
                      placeholder="Giới thiệu về công ty của bạn"
                      value={formData?.description || ""}
                      onChange={(e) =>
                        handleInputChange("description", e.target.value)
                      }
                      rows="4"
                    />
                  ) : (
                    <span className="profile-text profile-text-multiline">
                      {profile?.description || "Chưa cập nhật"}
                    </span>
                  )}
                </div>
              </div>

              
              {isEditing && (
                <div className="profile-actions">
                  <button
                    className="btn-cancel"
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    Hủy
                  </button>
                  <button
                    className="btn-save"
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <svg
                          className="spinner-icon"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                        Đang lưu...
                      </>
                    ) : (
                      <>Lưu thay đổi</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyProfile;
