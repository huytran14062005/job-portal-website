import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { authApis, endpoints } from "../configs/Apis";
import { MyUserContext } from "../configs/Contexts";
import "../css/NotificationBell.css";

const NOTIFICATIONS_PER_PAGE = 3;

const NotificationBell = () => {
  const navigate = useNavigate();
  const [user] = useContext(MyUserContext);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const dropdownRef = useRef(null);

  
  const fetchUnreadCount = async () => {
    if (!user) return;

    try {
      const api = authApis();
      const response = await api.get(endpoints["unread-count"]);
      setUnreadCount(response.data.unread_count || 0);
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  };

  
  const fetchNotifications = async (pageNum = 1, append = false) => {
    if (!user || loading) return;

    try {
      setLoading(true);
      const api = authApis();
      const response = await api.get(endpoints.notifications, {
        params: { page: pageNum, per_page: NOTIFICATIONS_PER_PAGE },
      });

      const newNotifications = response.data.notifications || [];
      const total = Number(response.data.total);
      const currentPageSize =
        Number(response.data.per_page) || NOTIFICATIONS_PER_PAGE;

      if (append) {
        setNotifications((prev) => [...prev, ...newNotifications]);
      } else {
        setNotifications(newNotifications);
      }

      setHasMore(
        Number.isFinite(total)
          ? pageNum * currentPageSize < total
          : newNotifications.length === NOTIFICATIONS_PER_PAGE,
      );
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  
  useEffect(() => {
    if (user) {
      fetchUnreadCount();

      
      const interval = setInterval(fetchUnreadCount, 30000);

      return () => clearInterval(interval);
    }
  }, [user]);

  
  useEffect(() => {
    if (showDropdown && user) {
      setPage(1);
      setNotifications([]);
      setHasMore(true);
      fetchNotifications(1, false);
    }
  }, [showDropdown, user]);

  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  
  const handleMarkAsRead = async (notificationId, e) => {
    e.stopPropagation();

    try {
      const api = authApis();
      await api.put(endpoints["mark-notification-read"](notificationId));

      
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  
  const handleMarkAllAsRead = async () => {
    try {
      const api = authApis();
      await api.put(endpoints["mark-all-read"]);

      
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, is_read: true })),
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  
  const handleDelete = async (notificationId, e) => {
    e.stopPropagation();

    try {
      const api = authApis();
      await api.delete(endpoints["delete-notification"](notificationId));

      
      const deletedNotif = notifications.find((n) => n.id === notificationId);
      setNotifications((prev) =>
        prev.filter((notif) => notif.id !== notificationId),
      );

      if (deletedNotif && !deletedNotif.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  
  const handleNotificationClick = async (notification) => {
    
    if (!notification.is_read) {
      handleMarkAsRead(notification.id, { stopPropagation: () => {} });
    }

    
    if (notification.type === "tin nhắn mới" && notification.related_id) {
      
      if (user.role === "ungvien") {
        
        navigate(`/companies/${notification.related_id}`);
      } else if (user.role === "nhatuyendung") {
        
        navigate("/company/applications");
      }
    } else if (
      notification.related_type === "application" &&
      notification.related_id
    ) {
      
      if (user.role === "nhatuyendung") {
        navigate("/company/applications");
      } else {
        navigate("/my-applications");
      }
    } else if (
      notification.related_type === "job_post" &&
      notification.related_id
    ) {
      
      navigate(`/jobs/${notification.related_id}`);
    }

    setShowDropdown(false);
  };

  
  const handleLoadMore = () => {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage, true);
  };

  
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  

  if (!user) return null;

  return (
    <div className="notification-bell-wrapper" ref={dropdownRef}>
      <button
        className="notification-bell-button"
        onClick={() => setShowDropdown(!showDropdown)}
        aria-label="Thông báo"
      >
        <svg
          className={`bell-icon ${unreadCount > 0 ? "ringing" : ""}`}
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <h3>Thông báo</h3>
            {unreadCount > 0 && (
              <button
                className="mark-all-read-btn"
                onClick={handleMarkAllAsRead}
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          <div className="notification-list">
            {loading && notifications.length === 0 ? (
              <div className="notification-loading">
                <div className="spinner-small"></div>
                <p>Đang tải...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#d1d5db"
                  strokeWidth="1.5"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <p>Chưa có thông báo nào</p>
              </div>
            ) : (
              <>
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-item ${!notification.is_read ? "unread" : ""}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-content">
                      <p className="notification-text">
                        {notification.content}
                      </p>
                      <span className="notification-time">
                        {formatTime(notification.created_at)}
                      </span>
                    </div>
                    <div className="notification-actions">
                      {!notification.is_read && (
                        <button
                          className="notification-mark-read"
                          onClick={(e) => handleMarkAsRead(notification.id, e)}
                          title="Đánh dấu đã đọc"
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
                      )}
                      <button
                        className="notification-delete"
                        onClick={(e) => handleDelete(notification.id, e)}
                        title="Xóa"
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
                ))}

                {hasMore && (
                  <button
                    className="notification-load-more"
                    onClick={handleLoadMore}
                    disabled={loading}
                  >
                    {loading ? "Đang tải..." : "Xem thêm thông báo"}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
