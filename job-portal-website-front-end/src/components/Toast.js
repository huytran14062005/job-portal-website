import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import "../css/Toast.css";

const ToastContext = createContext(null);


const toastIcons = {
  success: (
    <>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeWidth="2" />
      <polyline points="22 4 12 14.01 9 11.01" strokeWidth="2" />
    </>
  ),
  error: (
    <>
      <circle cx="12" cy="12" r="10" strokeWidth="2" />
      <line x1="15" y1="9" x2="9" y2="15" strokeWidth="2" />
      <line x1="9" y1="9" x2="15" y2="15" strokeWidth="2" />
    </>
  ),
  warning: (
    <>
      <path
        d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        strokeWidth="2"
      />
      <line x1="12" y1="9" x2="12" y2="13" strokeWidth="2" />
      <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="10" strokeWidth="2" />
      <line x1="12" y1="16" x2="12" y2="12" strokeWidth="2" />
      <line x1="12" y1="8" x2="12.01" y2="8" strokeWidth="2" />
    </>
  ),
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);
  const timersRef = useRef({});
  
  const activeRef = useRef({});

  const removeToast = useCallback((id) => {
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }

    const key = Object.keys(activeRef.current).find(
      (k) => activeRef.current[k] === id,
    );
    if (key) delete activeRef.current[key];

    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = "info", duration = 3000) => {
      if (!message) return;

      
      const key = `${type}|${String(message)}`;
      const existingId = activeRef.current[key];

      if (existingId) {
        clearTimeout(timersRef.current[existingId]);
        timersRef.current[existingId] = setTimeout(
          () => removeToast(existingId),
          duration,
        );
        return;
      }

      const id = ++idRef.current;
      activeRef.current[key] = id;
      setToasts((prev) => [...prev, { id, message, type }]);

      timersRef.current[id] = setTimeout(() => removeToast(id), duration);
    },
    [removeToast],
  );

  
  const toast = useMemo(
    () => ({
      success: (message, duration) => showToast(message, "success", duration),
      error: (message, duration) => showToast(message, "error", duration),
      warning: (message, duration) => showToast(message, "warning", duration),
      info: (message, duration) => showToast(message, "info", duration),
    }),
    [showToast],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}

      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`} role="alert">
            <svg
              className="toast-icon"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              {toastIcons[t.type] || toastIcons.info}
            </svg>

            <span className="toast-message">{t.message}</span>

            <button
              className="toast-close"
              onClick={() => removeToast(t.id)}
              title="Đóng"
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
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast phải được dùng bên trong <ToastProvider>");
  }

  return context;
};
