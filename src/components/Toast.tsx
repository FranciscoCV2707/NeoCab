import { useEffect, useState } from 'react';
import { useNotificationStore, Toast as ToastType } from '../stores/useNotificationStore';
import './Toast.css';

export function ToastContainer() {
  const { toasts, removeToast } = useNotificationStore();

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: ToastType;
  onDismiss: () => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [progress, setProgress] = useState(100);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (toast.duration === 0) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / toast.duration) * 100);
      setProgress(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        setIsExiting(true);
        setTimeout(onDismiss, 300);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [toast.duration, onDismiss]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(onDismiss, 300);
  };

  const handleActionClick = (action: () => void) => {
    action();
    handleDismiss();
  };

  return (
    <div className={`toast toast-${toast.type} ${isExiting ? 'toast-exit' : ''}`}>
      <div className="toast-content">
        <div className="toast-icon">
          {toast.type === 'success' && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          )}
          {toast.type === 'error' && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M15 9l-6 6M9 9l6 6" />
            </svg>
          )}
          {toast.type === 'warning' && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 9v4M12 17h.01" />
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          )}
          {toast.type === 'info' && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
          )}
        </div>
        <div className="toast-body">
          <div className="toast-title">{toast.title}</div>
          <div className="toast-message">{toast.message}</div>
          {toast.actions && toast.actions.length > 0 && (
            <div className="toast-actions">
              {toast.actions.map((action, index) => (
                <button
                  key={index}
                  className="toast-action-btn"
                  onClick={() => handleActionClick(action.action)}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="toast-close" onClick={handleDismiss}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      {toast.duration > 0 && (
        <div
          className="toast-progress"
          style={{ width: `${progress}%` }}
        />
      )}
    </div>
  );
}