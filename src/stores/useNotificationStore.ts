import { create } from 'zustand';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastAction {
  label: string;
  action: () => void;
}

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration: number;
  actions?: ToastAction[];
  createdAt: number;
}

interface NotificationState {
  toasts: Toast[];
  queue: Toast[];
  current: Toast | null;
}

interface NotificationActions {
  addToast: (toast: Omit<Toast, 'id' | 'createdAt'>) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
  showSuccess: (title: string, message: string, duration?: number) => string;
  showError: (title: string, message: string, duration?: number) => string;
  showWarning: (title: string, message: string, duration?: number) => string;
  showInfo: (title: string, message: string, duration?: number) => string;
}

const DEFAULT_DURATION = 4500;

export const useNotificationStore = create<NotificationState & NotificationActions>(
  (set, get) => ({
    toasts: [],
    queue: [],
    current: null,

    addToast: (toast) => {
      const id = generateId();
      const newToast: Toast = {
        ...toast,
        id,
        createdAt: Date.now(),
        duration: toast.duration ?? DEFAULT_DURATION,
      };

      set((state) => ({
        toasts: [...state.toasts, newToast],
      }));

      if (newToast.duration > 0) {
        setTimeout(() => {
          get().removeToast(id);
        }, newToast.duration);
      }

      return id;
    },

    removeToast: (id) => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    },

    clearAll: () => {
      set({ toasts: [], queue: [], current: null });
    },

    showSuccess: (title, message, duration = DEFAULT_DURATION) => {
      return get().addToast({ type: 'success', title, message, duration });
    },

    showError: (title, message, duration = 0) => {
      return get().addToast({ type: 'error', title, message, duration });
    },

    showWarning: (title, message, duration = DEFAULT_DURATION) => {
      return get().addToast({ type: 'warning', title, message, duration });
    },

    showInfo: (title, message, duration = DEFAULT_DURATION) => {
      return get().addToast({ type: 'info', title, message, duration });
    },
  })
);

export const toast = {
  success: (title: string, message: string) =>
    useNotificationStore.getState().showSuccess(title, message),
  error: (title: string, message: string) =>
    useNotificationStore.getState().showError(title, message),
  warning: (title: string, message: string) =>
    useNotificationStore.getState().showWarning(title, message),
  info: (title: string, message: string) =>
    useNotificationStore.getState().showInfo(title, message),
};