import { useEffect, useRef, useCallback } from 'react';
import { InputAction, loadKeymap } from '../hooks/useUnifiedInput';

interface UseKeyboardNavOptions {
  itemCount: number;
  focusedIndex: number;
  onIndexChange: (index: number) => void;
  onConfirm?: () => void;
  onBack?: () => void;
  enabled?: boolean;
  cols?: number;
}

export function useKeyboardNav({
  itemCount,
  focusedIndex,
  onIndexChange,
  onConfirm,
  onBack,
  enabled = true,
  cols = 1,
}: UseKeyboardNavOptions) {
  const onIndexChangeRef = useRef(onIndexChange);
  const onConfirmRef = useRef(onConfirm);
  const onBackRef = useRef(onBack);
  const focusedIndexRef = useRef(focusedIndex);
  const itemCountRef = useRef(itemCount);
  const colsRef = useRef(cols);

  useEffect(() => { onIndexChangeRef.current = onIndexChange; }, [onIndexChange]);
  useEffect(() => { if (onConfirm) onConfirmRef.current = onConfirm; }, [onConfirm]);
  useEffect(() => { if (onBack) onBackRef.current = onBack; }, [onBack]);
  useEffect(() => { focusedIndexRef.current = focusedIndex; }, [focusedIndex]);
  useEffect(() => { itemCountRef.current = itemCount; }, [itemCount]);
  useEffect(() => { colsRef.current = cols; }, [cols]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const keymap = loadKeymap();
      let action: InputAction | null = null;

      for (const [a, keys] of Object.entries(keymap.keyboard)) {
        if (keys.includes(e.key)) {
          action = a as InputAction;
          break;
        }
      }

      if (!action) return;

      e.preventDefault();
      const current = focusedIndexRef.current;
      const total = itemCountRef.current;
      const c = colsRef.current;

      let next = current;

      switch (action) {
        case 'up':
          next = Math.max(0, current - c);
          break;
        case 'down':
          next = Math.min(total - 1, current + c);
          break;
        case 'left':
          next = Math.max(0, current - 1);
          break;
        case 'right':
          next = Math.min(total - 1, current + 1);
          break;
        case 'page_up':
          next = Math.max(0, current - c * 5);
          break;
        case 'page_down':
          next = Math.min(total - 1, current + c * 5);
          break;
        case 'confirm':
          onConfirmRef.current?.();
          return;
        case 'back':
          onBackRef.current?.();
          return;
        default:
          return;
      }

      if (next !== current) {
        onIndexChangeRef.current(next);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);

  const navigate = useCallback((direction: 'up' | 'down' | 'left' | 'right' | 'page_up' | 'page_down') => {
    const current = focusedIndexRef.current;
    const total = itemCountRef.current;
    const c = colsRef.current;
    let next = current;

    switch (direction) {
      case 'up': next = Math.max(0, current - c); break;
      case 'down': next = Math.min(total - 1, current + c); break;
      case 'left': next = Math.max(0, current - 1); break;
      case 'right': next = Math.min(total - 1, current + 1); break;
      case 'page_up': next = Math.max(0, current - c * 5); break;
      case 'page_down': next = Math.min(total - 1, current + c * 5); break;
    }

    if (next !== current) {
      onIndexChangeRef.current(next);
    }
  }, []);

  const confirm = useCallback(() => {
    onConfirmRef.current?.();
  }, []);

  const back = useCallback(() => {
    onBackRef.current?.();
  }, []);

  return { navigate, confirm, back };
}
