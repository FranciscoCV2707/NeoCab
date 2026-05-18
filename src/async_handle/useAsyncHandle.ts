import { useCallback, useRef } from 'react';
import { useAsyncStore, type AsyncHandle } from './useAsyncStore';
import type { CreateAsyncHandleOptions, AsyncOperation } from './types';

export function useAsyncHandle<T = unknown>(_: CreateAsyncHandleOptions<T> | undefined) {
  const handleRef = useRef<AsyncHandle<T> | null>(null);

  const createHandle = useAsyncStore((state) => state.createHandle);

  const start = useCallback(
    async <R>(
      asyncFn: (handle: AsyncHandle<T>) => Promise<R>,
      optOptions?: CreateAsyncHandleOptions<T>
    ): Promise<R> => {
      const handle = createHandle<T>(optOptions);
      handleRef.current = handle;

      try {
        const result = await asyncFn(handle);
        handle.complete(result as T);
        return result;
      } catch (error) {
        handle.fail(error instanceof Error ? error.message : String(error));
        throw error;
      }
    },
    [createHandle]
  );

  const withProgress = useCallback(
    async <R>(
      asyncFn: (progress: (current: number, total: number, message?: string) => void) => Promise<R>,
      optOptions?: CreateAsyncHandleOptions<T>
    ): Promise<R> => {
      const handle = createHandle<T>(optOptions);
      handleRef.current = handle;

      const progress = (current: number, total: number, message = '') => {
        handle.setProgress(current, total, message);
      };

      try {
        const result = await asyncFn(progress);
        handle.complete(result as T);
        return result;
      } catch (error) {
        handle.fail(error instanceof Error ? error.message : String(error));
        throw error;
      }
    },
    [createHandle]
  );

  return {
    start,
    withProgress,
    currentHandle: handleRef.current,
  };
}

export function useAsyncOperationMonitor(id: string) {
  const operation = useAsyncStore((state) => state.operations.get(id)) as AsyncOperation | undefined;
  const cancel = useAsyncStore((state) => state.cancelOperation);

  return {
    operation,
    progress: operation?.progress || null,
    isPending: operation?.status === 'pending',
    isInProgress: operation?.status === 'in_progress',
    isCompleted: operation?.status === 'completed',
    isFailed: operation?.status === 'failed',
    isCancelled: operation?.status === 'cancelled',
    result: operation?.result,
    error: operation?.error,
    cancel: () => cancel(id),
  };
}

export function useActiveOperations() {
  const activeOperations = useAsyncStore((state) => state.activeOperations);
  const operations = useAsyncStore((state) => state.operations);

  return activeOperations
    .map((opId) => operations.get(opId))
    .filter((op): op is AsyncOperation => op !== undefined);
}

export function useCompletedOperations() {
  const completedOperations = useAsyncStore((state) => state.completedOperations);
  const operations = useAsyncStore((state) => state.operations);

  return completedOperations
    .map((opId) => operations.get(opId))
    .filter((op): op is AsyncOperation => op !== undefined);
}