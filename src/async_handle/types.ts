export type AsyncStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface AsyncProgress {
  current: number;
  total: number;
  percentage: number;
  message: string;
  startedAt: number;
  updatedAt: number;
}

export interface AsyncHandle<T = unknown> {
  id: string;
  status: AsyncStatus;
  progress: AsyncProgress | null;
  result: T | null;
  error: string | null;
  cancel: () => void;
}

export interface AsyncOperation<T = unknown> {
  id: string;
  status: AsyncStatus;
  progress: AsyncProgress | null;
  result: T | null;
  error: string | null;
  cancelFn: (() => void) | null;
  createdAt: number;
  completedAt: number | null;
}

export interface CreateAsyncHandleOptions<T = unknown> {
  id?: string;
  onProgress?: (progress: AsyncProgress) => void;
  onComplete?: (result: T) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

export type AsyncCallback<T = unknown> = {
  handle: AsyncOperation<T>;
  update: (updates: Partial<AsyncOperation<T>>) => void;
  setProgress: (current: number, total: number, message?: string) => void;
  complete: (result: T) => void;
  fail: (error: string) => void;
  cancel: () => void;
};

export function createProgress(current: number, total: number, message: string): AsyncProgress {
  return {
    current,
    total,
    percentage: total > 0 ? Math.round((current / total) * 100) : 0,
    message,
    startedAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function isActive(status: AsyncStatus): boolean {
  return status === 'pending' || status === 'in_progress';
}

export function isComplete(status: AsyncStatus): boolean {
  return status === 'completed' || status === 'failed' || status === 'cancelled';
}