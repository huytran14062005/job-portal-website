import React from "react";

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  icon = "warning",
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (icon) {
      case "warning":
        return (
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="confirm-icon warning"
          >
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" />
            <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" />
          </svg>
        );
      case "danger":
        return (
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="confirm-icon danger"
          >
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <line x1="15" y1="9" x2="9" y2="15" strokeWidth="2" />
            <line x1="9" y1="9" x2="15" y2="15" strokeWidth="2" />
          </svg>
        );
      case "logout":
        return (
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="confirm-icon logout"
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
        );
      default:
        return null;
    }
  };

  const iconElement = getIcon();

  return (
    <div className="logout-confirm-overlay" onClick={onClose}>
      <div
        className="logout-confirm-box"
        onClick={(e) => e.stopPropagation()}
      >
        {iconElement && <div className="logout-confirm-icon">{iconElement}</div>}

        <h3 className="logout-confirm-title">{title}</h3>
        <p className="logout-confirm-text">{message}</p>

        <div className="logout-confirm-actions">
          <button
            type="button"
            className="logout-confirm-btn logout-confirm-cancel"
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="logout-confirm-btn logout-confirm-ok"
            onClick={onConfirm}
            autoFocus
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
