import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { authApis, endpoints } from "../../configs/Apis";
import CVManagement from "../../components/CVManagement";
import { getApiError } from "../../utils/apiError";
import {
  getApplicantAvatar,
  onApplicantAvatarError,
} from "../../utils/defaultImages";

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("account");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (searchParams.get("section") === "cv") {
      setActiveSection("cv");
    }
  }, [searchParams]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await authApis().get(endpoints["current-user"]);

      let dateForInput = "";
      if (response.data.date_of_birth) {
        const parts = response.data.date_of_birth.split("-");
        if (parts.length === 3) {
          dateForInput = `${parts[2]}-${parts[1]}-${parts[0]}`; 
        }
      }

      setProfile({
        ...response.data,
        date_of_birth_display: response.data.date_of_birth, 
        date_of_birth: dateForInput, 
      });

      setFormData({
        ...response.data,
        date_of_birth: dateForInput,
      });
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(getApiError(err, "Không thể tải thông tin cá nhân."));
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
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData(profile); 
    setError("");
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    
    
    setAvatarFile(file);

    
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
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
      formDataToSend.append("full_name", formData.full_name || "");
      formDataToSend.append("gender", formData.gender || "");

      
      if (formData.date_of_birth) {
        const parts = formData.date_of_birth.split("-");
        if (parts.length === 3) {
          const ddmmyyyy = `${parts[2]}-${parts[1]}-${parts[0]}`;
          formDataToSend.append("date_of_birth", ddmmyyyy);
        }
      } else {
        formDataToSend.append("date_of_birth", "");
      }

      formDataToSend.append("phone", formData.phone || "");
      formDataToSend.append("address", formData.address || "");
      formDataToSend.append("description", formData.description || "");

      
      if (avatarFile) {
        formDataToSend.append("avatar", avatarFile);
      }

      const api = authApis();
      await api.put(endpoints["update-profile"], formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccessMessage("Cập nhật thông tin thành công!");
      await fetchProfile();
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);

      
      window.dispatchEvent(new Event("profileUpdated"));

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(getApiError(err));
    } finally {
      setSaving(false);
    }
  };

  
  const getRoleInfo = (role) => {
    const roleConfig = {
      ungvien: {
        label: "Ứng viên",
        className: "role-badge-candidate",
        icon: (
          <>
            <path
              d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
              strokeWidth="2"
            />
            <circle cx="12" cy="7" r="4" strokeWidth="2" />
          </>
        ),
      },
      nhatuyendung: {
        label: "Nhà tuyển dụng",
        className: "role-badge-employer",
        icon: (
          <>
            <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" strokeWidth="2" />
          </>
        ),
      },
      admin: {
        label: "Quản trị viên",
        className: "role-badge-admin",
        icon: (
          <>
            <path
              d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
              strokeWidth="2"
            />
          </>
        ),
      },
    };

    return roleConfig[role] || null;
  };

  const formatGender = (gender) => {
    if (!gender) return "Chưa cập nhật";
    const genderLower = gender.toLowerCase();
    if (genderLower === "nam") return "Nam";
    if (genderLower === "nữ") return "Nữ";
    if (genderLower === "nu") return "Nữ"; 
    return "Chưa cập nhật";
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
            <path
              d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
              strokeWidth="2"
            />
            <circle cx="12" cy="7" r="4" strokeWidth="2" />
          </svg>
          <div>
            <div className="sidebar-title">Tài khoản</div>
            <div className="sidebar-desc">Tùy chỉnh thông tin cá nhân</div>
          </div>
        </button>

        {profile?.role === "ungvien" && (
          <button
            className={`sidebar-item ${activeSection === "cv" ? "active" : ""}`}
            onClick={() => setActiveSection("cv")}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                strokeWidth="2"
              />
              <polyline points="14 2 14 8 20 8" strokeWidth="2" />
              <line x1="16" y1="13" x2="8" y2="13" strokeWidth="2" />
              <line x1="16" y1="17" x2="8" y2="17" strokeWidth="2" />
            </svg>
            <div>
              <div className="sidebar-title">Danh sách CV</div>
              <div className="sidebar-desc">Quản lý CV của bạn</div>
            </div>
          </button>
        )}
      </div>

      
      <div className="profile-main">
        {activeSection === "account" && (
          <div className="profile-section">
            <div className="section-header-simple">
              <div>
                <h1 className="section-heading">Thông tin tài khoản</h1>
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
                <label className="profile-label">Ảnh đại diện</label>
                <div className="profile-value">
                  <div className="avatar-section">
                    <div className="avatar-wrapper">
                      <img
                        src={avatarPreview || getApplicantAvatar(profile?.avatar_url)}
                        alt="Avatar"
                        className="avatar-image"
                        onError={onApplicantAvatarError}
                      />
                    </div>

                    
                    {getRoleInfo(profile?.role) && (
                      <span
                        className={`role-badge ${getRoleInfo(profile.role).className}`}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          {getRoleInfo(profile.role).icon}
                        </svg>
                        {getRoleInfo(profile.role).label}
                      </span>
                    )}

                    {isEditing && (
                      <div className="avatar-upload-controls">
                        <input
                          type="file"
                          id="avatar-upload"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          style={{ display: "none" }}
                        />
                        <label
                          htmlFor="avatar-upload"
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
                          Chọn ảnh
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
                <label className="profile-label">Họ và tên:</label>
                <div className="profile-value">
                  {isEditing ? (
                    <input
                      type="text"
                      className="profile-input"
                      value={formData?.full_name || ""}
                      onChange={(e) =>
                        handleInputChange("full_name", e.target.value)
                      }
                      placeholder="Nhập họ và tên"
                    />
                  ) : (
                    <span className="profile-text">
                      {profile?.full_name || "Chưa cập nhật"}
                    </span>
                  )}
                </div>
              </div>

              
              <div className="profile-field">
                <label className="profile-label">
                  Địa chỉ email <span className="text-required">*</span>
                </label>
                <div className="profile-value">
                  <span className="profile-text">{profile?.email || ""}</span>
                </div>
              </div>

              
              <div className="profile-field profile-field-compact">
                <label className="profile-label">Giới tính</label>
                <div className="profile-value">
                  {isEditing ? (
                    <div className="custom-select-wrapper">
                      <select
                        className="profile-input profile-input-compact"
                        value={formData?.gender || ""}
                        onChange={(e) =>
                          handleInputChange("gender", e.target.value)
                        }
                        onClick={() =>
                          setShowGenderDropdown(!showGenderDropdown)
                        }
                        onBlur={() =>
                          setTimeout(() => setShowGenderDropdown(false), 150)
                        }
                      >
                        <option value="">Chọn giới tính</option>
                        <option value="nam">Nam</option>
                        <option value="nữ">Nữ</option>
                      </select>
                      <svg
                        className={`select-arrow ${showGenderDropdown ? "open" : ""}`}
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline
                          points="6 9 12 15 18 9"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  ) : (
                    <span className="profile-text">
                      {formatGender(profile?.gender)}
                    </span>
                  )}
                </div>
              </div>

              
              <div className="profile-field profile-field-compact">
                <label className="profile-label">Ngày sinh:</label>
                <div className="profile-value">
                  {isEditing ? (
                    <div className="input-with-error">
                      <input
                        type="date"
                        className="profile-input profile-input-compact"
                        value={formData?.date_of_birth || ""}
                        onChange={(e) =>
                          handleInputChange("date_of_birth", e.target.value)
                        }
                        placeholder="dd/mm/yyyy"
                      />
                    </div>
                  ) : (
                    <span className="profile-text">
                      {profile?.date_of_birth_display || "Chưa cập nhật"}
                    </span>
                  )}
                </div>
              </div>

              
              <div className="profile-field profile-field-compact">
                <label className="profile-label">Số điện thoại:</label>
                <div className="profile-value">
                  {isEditing ? (
                    <input
                      type="text"
                      className="profile-input profile-input-compact"
                      placeholder="Nhập số điện thoại"
                      value={formData?.phone || ""}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                    />
                  ) : (
                    <span className="profile-text">
                      {profile?.phone || "Chưa cập nhật"}
                    </span>
                  )}
                </div>
              </div>

              
              <div className="profile-field">
                <label className="profile-label">Địa chỉ:</label>
                <div className="profile-value">
                  {isEditing ? (
                    <input
                      type="text"
                      className="profile-input"
                      placeholder="Nhập địa chỉ"
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
                <label className="profile-label">Giới thiệu bản thân</label>
                <div className="profile-value">
                  {isEditing ? (
                    <textarea
                      className="profile-textarea"
                      placeholder="Giới thiệu về bản thân"
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

        {activeSection === "cv" && <CVManagement />}
      </div>
    </div>
  );
};

export default Profile;
