import { create } from 'zustand';
import type {
  AsyncOperation,
  AsyncStatus,
  AsyncProgress,
  CreateAsyncHandleOptions,
} from './types';
import { createProgress, isActive } from './types';

interface AsyncState {
  operations: Map<string, AsyncOperation>;
  activeOperations: string[];
  completedOperations: string[];
  failedOperations: string[];
}

export interface AsyncHandle<T = unknown> {
  id: string;
  update: (updates: Partial<AsyncOperation<T>>) => void;
  setProgress: (current: number, total: number, message?: string) => void;
  complete: (result: T) => void;
  fail: (error: string) => void;
  cancel: () => void;
}

interface AsyncActions {
  createHandle: <T = unknown>(options?: CreateAsyncHandleOptions<T>) => AsyncHandle<T>;
  getOperation: (id: string) => AsyncOperation | undefined;
  updateOperation: (id: string, updates: Partial<AsyncOperation>) => void;
  setProgress: (id: string, current: number, total: number, message?: string) => void;
  completeOperation: <T = unknown>(id: string, result: T) => void;
  failOperation: (id: string, error: string) => void;
  cancelOperation: (id: string) => void;
  remove: (id: string) => void;
  clearCompleted: () => void;
  clearAll: () => void;
}

function generateId(): string {
  return `async_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const useAsyncStore = create<AsyncState & AsyncActions>((set, get) => ({
  operations: new Map(),
  activeOperations: [],
  completedOperations: [],
  failedOperations: [],

  createHandle: <T = unknown>(options: CreateAsyncHandleOptions<T> = {}): AsyncHandle<T> => {
    const id = options.id || generateId();

    const operation: AsyncOperation<T> = {
      id,
      status: 'pending',
      progress: null,
      result: null,
      error: null,
      cancelFn: null,
      createdAt: Date.now(),
      completedAt: null,
    };

    set((state) => {
      const newOperations = new Map(state.operations);
      newOperations.set(id, operation);
      return {
        operations: newOperations,
        activeOperations: [...state.activeOperations, id],
      };
    });

    return {
      id,
      update: (updates) => {
        set((state) => {
          const op = state.operations.get(id);
          if (!op) return state;
          const newOperations = new Map(state.operations);
          newOperations.set(id, { ...op, ...updates } as AsyncOperation<T>);
          return { operations: newOperations };
        });
      },
      setProgress: (current, total, message = '') => {
        const progress = createProgress(current, total, message);
        set((state) => {
          const op = state.operations.get(id);
          if (!op) return state;
          const newOperations = new Map(state.operations);
          newOperations.set(id, {
            ...op,
            status: 'in_progress',
            progress,
          } as AsyncOperation<T>);
          return { operations: newOperations };
        });
      },
      complete: (result) => {
        set((state) => {
          const op = state.operations.get(id);
          if (!op) return state;
          const newOperations = new Map(state.operations);
          const completedOp = {
            ...op,
            status: 'completed' as AsyncStatus,
            result,
            progress: op.progress ? { ...op.progress, current: op.progress.total, percentage: 100 } : null,
            completedAt: Date.now(),
          } as AsyncOperation<T>;
          newOperations.set(id, completedOp);
          return {
            operations: newOperations,
            activeOperations: state.activeOperations.filter((aid) => aid !== id),
            completedOperations: [...state.completedOperations, id],
          };
        });
        options.onComplete?.(result);
      },
      fail: (error) => {
        set((state) => {
          const op = state.operations.get(id);
          if (!op) return state;
          const newOperations = new Map(state.operations);
          const failedOp = {
            ...op,
            status: 'failed' as AsyncStatus,
            error,
            completedAt: Date.now(),
          } as AsyncOperation<T>;
          newOperations.set(id, failedOp);
          return {
            operations: newOperations,
            activeOperations: state.activeOperations.filter((aid) => aid !== id),
            failedOperations: [...state.failedOperations, id],
          };
        });
        options.onError?.(error);
      },
      cancel: () => {
        const op = get().operations.get(id);
        op?.cancelFn?.();
        set((state) => {
          const newOperations = new Map(state.operations);
          const cancelledOp = {
            ...(newOperations.get(id) || {}),
            status: 'cancelled' as AsyncStatus,
            completedAt: Date.now(),
          };
          newOperations.set(id, cancelledOp as AsyncOperation<T>);
          return {
            operations: newOperations,
            activeOperations: state.activeOperations.filter((aid) => aid !== id),
          };
        });
        options.onCancel?.();
      },
    };
  },

  getOperation: (id: string) => get().operations.get(id),

  updateOperation: (id: string, updates: Partial<AsyncOperation>) => {
    set((state) => {
      const op = state.operations.get(id);
      if (!op) return state;
      const newOperations = new Map(state.operations);
      newOperations.set(id, { ...op, ...updates } as AsyncOperation);
      return { operations: newOperations };
    });
  },

  setProgress: (id: string, current: number, total: number, message = '') => {
    const progress = createProgress(current, total, message);
    set((state) => {
      const op = state.operations.get(id);
      if (!op) return state;
      const newOperations = new Map(state.operations);
      newOperations.set(id, {
        ...op,
        status: 'in_progress',
        progress,
      });
      return { operations: newOperations };
    });
  },

  completeOperation: <T = unknown>(id: string, result: T) => {
    get().createHandle<T>({ id }).complete(result);
  },

  failOperation: (id: string, error: string) => {
    get().createHandle({ id }).fail(error);
  },

  cancelOperation: (id: string) => {
    const op = get().operations.get(id);
    op?.cancelFn?.();
    set((state) => {
      const newOperations = new Map(state.operations);
      const cancelledOp = {
        ...(newOperations.get(id) || {}),
        status: 'cancelled' as AsyncStatus,
        completedAt: Date.now(),
      };
      newOperations.set(id, cancelledOp as AsyncOperation);
      return {
        operations: newOperations,
        activeOperations: state.activeOperations.filter((aid) => aid !== id),
      };
    });
  },

  remove: (id: string) => {
    set((state) => {
      const newOperations = new Map(state.operations);
      newOperations.delete(id);
      return {
        operations: newOperations,
        activeOperations: state.activeOperations.filter((aid) => aid !== id),
        completedOperations: state.completedOperations.filter((aid) => aid !== id),
        failedOperations: state.failedOperations.filter((aid) => aid !== id),
      };
    });
  },

  clearCompleted: () => {
    set((state) => {
      const newOperations = new Map(state.operations);
      state.completedOperations.forEach((opId) => newOperations.delete(opId));
      return {
        operations: newOperations,
        completedOperations: [],
      };
    });
  },

  clearAll: () => {
    set({
      operations: new Map(),
      activeOperations: [],
      completedOperations: [],
      failedOperations: [],
    });
  },
}));

export function useAsyncOperation<T = unknown>(id: string) {
  const operation = useAsyncStore((state) => state.operations.get(id)) as AsyncOperation<T> | undefined;
  const cancel = useAsyncStore((state) => state.cancelOperation);
  const remove = useAsyncStore((state) => state.remove);

  return {
    operation,
    isActive: operation ? isActive(operation.status) : false,
    cancel: () => cancel(id),
    remove: () => remove(id),
  };
}