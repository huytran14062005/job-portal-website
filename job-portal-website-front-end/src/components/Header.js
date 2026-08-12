import React, { useContext, useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { MyUserContext } from "../configs/Contexts";
import { authApis, endpoints } from "../configs/Apis";
import NotificationBell from "./NotificationBell";
import { useToast } from "./Toast";
import {
  getAvatarByRole,
  onApplicantAvatarError,
  onCompanyLogoError,
} from "../utils/defaultImages";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [user, dispatch] = useContext(MyUserContext);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  
  const [isOverHero, setIsOverHero] = useState(false);
  const dropdownRef = useRef(null);

  
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          let response;
          if (user.role === "admin") {
            
            setUserProfile({ full_name: user.username });
            return;
          } else if (user.role === "nhatuyendung") {
            
            response = await authApis().get(endpoints["company-profile"]);
            setUserProfile({
              ...response.data,
              full_name: response.data.company_name,
              avatar_url: response.data.logo_url,
            });
          } else {
            
            response = await authApis().get(endpoints["current-user"]);
            setUserProfile(response.data);
          }
        } catch (err) {
          console.error("Error fetching user profile:", err);
          
          setUserProfile({ full_name: user.username });
        }
      } else {
        setUserProfile(null);
      }
    };

    fetchUserProfile();

    
    const handleProfileUpdate = () => {
      fetchUserProfile();
    };

    window.addEventListener("profileUpdated", handleProfileUpdate);

    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdate);
    };
  }, [user]);

  
  useEffect(() => {
    const HEADER_HEIGHT = 70;
    let frame = null;

    const update = () => {
      frame = null;
      const hero = document.querySelector(".home-hero");
      
      setIsOverHero(
        !!hero && hero.getBoundingClientRect().bottom > HEADER_HEIGHT,
      );
    };

    const requestUpdate = () => {
      if (frame === null) frame = requestAnimationFrame(update);
    };

    update();
    
    requestUpdate();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, [location.pathname]);

  const handleNavigate = (path) => {
    navigate(path);
    setShowUserMenu(false);
  };

  
  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  
  const handleLogoutClick = () => {
    setShowUserMenu(false);
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    dispatch({ type: "LOGOUT" });
    setUserProfile(null);
    toast.success("Đăng xuất thành công!");
    navigate("/");
  };

  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  
  useEffect(() => {
    if (!showLogoutConfirm) return;

    const handleEsc = (event) => {
      if (event.key === "Escape") setShowLogoutConfirm(false);
    };

    document.addEventListener("keydown", handleEsc);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = prevOverflow;
    };
  }, [showLogoutConfirm]);

  
  const displayName = userProfile?.full_name || user?.username || "User";

  
  const getInitials = (name) => {
    if (!name) return "U";
    const names = name.split(" ");
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  
  const isAdmin = user?.role === "admin";
  const avatarSrc = getAvatarByRole(userProfile?.avatar_url, user?.role);
  const onAvatarError =
    user?.role === "nhatuyendung" ? onCompanyLogoError : onApplicantAvatarError;

  return (
    <>
      <header className={`header ${isOverHero ? "header-transparent" : ""}`}>
        <div className="header-container">
        
        <div className="header-logo">
          <Link to="/">
            <img
              src="/logo_web.jpg"
              alt="JobSearching - Kết nối sự nghiệp & nhân tài"
              className="logo-image logo-image-default"
            />
            <img
              src="/logo_web_white.png"
              alt=""
              aria-hidden="true"
              className="logo-image logo-image-light"
            />
          </Link>
        </div>

        
        <nav className="header-nav">
          <ul className="nav-menu">
            
            {(!user || user.role !== "admin") && (
              <>
                <li className="nav-item">
                  <span
                    className={`nav-link ${isActive("/jobs") ? "active" : ""}`}
                    onClick={() => handleNavigate("/jobs")}
                  >
                    Việc làm
                  </span>
                </li>
                <li className="nav-item">
                  <span
                    className={`nav-link ${
                      isActive("/companies") ? "active" : ""
                    }`}
                    onClick={() => handleNavigate("/companies")}
                  >
                    Công ty
                  </span>
                </li>
              </>
            )}
            {user && user.role === "ungvien" && (
              <li className="nav-item">
                <span
                  className={`nav-link ${
                    isActive("/my-applications") ? "active" : ""
                  }`}
                  onClick={() => handleNavigate("/my-applications")}
                >
                  Việc làm đã ứng tuyển
                </span>
              </li>
            )}
            {user && user.role === "admin" && (
              <>
                <li className="nav-item">
                  <span
                    className={`nav-link ${
                      isActive("/admin/users") ? "active" : ""
                    }`}
                    onClick={() => handleNavigate("/admin/users")}
                  >
                    Quản lý người dùng
                  </span>
                </li>
                <li className="nav-item">
                  <span
                    className={`nav-link ${
                      isActive("/admin/companies") ? "active" : ""
                    }`}
                    onClick={() => handleNavigate("/admin/companies")}
                  >
                    Quản lý công ty
                  </span>
                </li>
                <li className="nav-item">
                  <span
                    className={`nav-link ${
                      isActive("/admin/jobs") ? "active" : ""
                    }`}
                    onClick={() => handleNavigate("/admin/jobs")}
                  >
                    Quản lý bài đăng
                  </span>
                </li>
                <li className="nav-item">
                  <span
                    className={`nav-link ${
                      isActive("/admin/stats") ? "active" : ""
                    }`}
                    onClick={() => handleNavigate("/admin/stats")}
                  >
                    Thống kê
                  </span>
                </li>
              </>
            )}
            {user && user.role === "nhatuyendung" && (
              <>
                <li className="nav-item">
                  <span
                    className={`nav-link ${
                      isActive("/company/applications") ? "active" : ""
                    }`}
                    onClick={() => handleNavigate("/company/applications")}
                  >
                    Đơn ứng tuyển
                  </span>
                </li>
                <li className="nav-item">
                  <span
                    className={`nav-link ${
                      isActive("/company/post-job") ? "active" : ""
                    }`}
                    onClick={() => handleNavigate("/company/post-job")}
                  >
                    Đăng bài tuyển dụng
                  </span>
                </li>
              </>
            )}
          </ul>
        </nav>

        
        <div className="header-auth">
          {user === null ? (
            <>
              <button
                className="btn btn-register"
                onClick={() => handleNavigate("/register")}
              >
                Đăng ký
              </button>
              <button
                className="btn btn-login"
                onClick={() => handleNavigate("/login")}
              >
                Đăng nhập
              </button>
            </>
          ) : (
            <>
              
              <NotificationBell />

              <div className="user-menu-wrapper" ref={dropdownRef}>
                <button
                  className="user-menu-button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <div className="user-avatar">
                    {isAdmin ? (
                      <div className="user-avatar-placeholder">
                        {getInitials(displayName)}
                      </div>
                    ) : (
                      <img
                        src={avatarSrc}
                        alt={displayName}
                        className="user-avatar-image"
                        onError={onAvatarError}
                      />
                    )}
                  </div>
                  <span className="user-name">{displayName}</span>
                  <svg
                    className={`dropdown-arrow ${showUserMenu ? "open" : ""}`}
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

                {showUserMenu && (
                  <div className="user-dropdown-menu">
                    <div className="user-dropdown-header">
                      <div className="user-dropdown-avatar">
                        {isAdmin ? (
                          <div className="user-dropdown-avatar-placeholder">
                            {getInitials(displayName)}
                          </div>
                        ) : (
                          <img
                            src={avatarSrc}
                            alt={displayName}
                            className="user-dropdown-avatar-image"
                            onError={onAvatarError}
                          />
                        )}
                      </div>
                      <div className="user-dropdown-info">
                        <div className="user-dropdown-name">{displayName}</div>
                        <div className="user-dropdown-label">Tài khoản</div>
                      </div>
                    </div>

                    <div className="user-dropdown-divider"></div>

                    <div className="user-dropdown-items">
                      {user.role === "admin" && (
                        <button
                          className="user-dropdown-item"
                          onClick={() => handleNavigate("/admin/users")}
                        >
                          <svg
                            width="20"
                            height="20"
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
                            <circle
                              cx="9"
                              cy="7"
                              r="4"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <span>Quản lý người dùng</span>
                        </button>
                      )}

                      {user.role === "admin" && (
                        <button
                          className="user-dropdown-item"
                          onClick={() => handleNavigate("/admin/companies")}
                        >
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                          >
                            <path
                              d="M3 21h18M5 21V7l7-4 7 4v14M9 9h1m4 0h1M9 13h1m4 0h1M9 17h1m4 0h1"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <span>Quản lý công ty</span>
                        </button>
                      )}

                      {user.role === "admin" && (
                        <button
                          className="user-dropdown-item"
                          onClick={() => handleNavigate("/admin/jobs")}
                        >
                          <svg
                            width="20"
                            height="20"
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
                          <span>Quản lý bài đăng</span>
                        </button>
                      )}

                      {user.role !== "admin" && (
                        <button
                          className="user-dropdown-item"
                          onClick={() =>
                            handleNavigate(
                              user.role === "nhatuyendung"
                                ? "/company/profile"
                                : "/profile",
                            )
                          }
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
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <circle
                              cx="12"
                              cy="7"
                              r="4"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <span>Thông tin cá nhân</span>
                        </button>
                      )}

                      {user.role === "ungvien" ? (
                        <button
                          className="user-dropdown-item"
                          onClick={() => handleNavigate("/saved-jobs")}
                        >
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                          >
                            <path
                              d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <span>Việc đã lưu</span>
                        </button>
                      ) : user.role === "nhatuyendung" ? (
                        <button
                          className="user-dropdown-item"
                          onClick={() => handleNavigate("/company/my-jobs")}
                        >
                          <svg
                            width="20"
                            height="20"
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
                          <span>Bài đăng tuyển dụng</span>
                        </button>
                      ) : null}
                    </div>

                    <div className="user-dropdown-divider"></div>

                    <button
                      className="user-dropdown-item logout-item"
                      onClick={handleLogoutClick}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <polyline
                          points="16 17 21 12 16 7"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <line
                          x1="21"
                          y1="12"
                          x2="9"
                          y2="12"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
          </div>
        </div>
      </header>

      
      {showLogoutConfirm && (
        <div
          className="logout-confirm-overlay"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="logout-confirm-box"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-confirm-title"
            onClick={(e) => e.stopPropagation()}
          >

            <h3 className="logout-confirm-title" id="logout-confirm-title">
              Đăng xuất tài khoản?
            </h3>
            <p className="logout-confirm-text">
              Bạn có chắc muốn đăng xuất khỏi tài khoản{" "}
              <strong>{displayName}</strong> không?
            </p>

            <div className="logout-confirm-actions">
              <button
                type="button"
                className="logout-confirm-btn logout-confirm-cancel"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="logout-confirm-btn logout-confirm-ok"
                onClick={handleConfirmLogout}
                autoFocus
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
