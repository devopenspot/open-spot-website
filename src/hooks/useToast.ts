import { useCallback, useEffect, useState } from 'react';

export type ToastTone = 'info' | 'success' | 'error';

export interface Toast {
  id: string;
  message: string;
  tone: ToastTone;
}

const subscribers = new Set<(toasts: Toast[]) => void>();
let nextId = 0;
let queue: Toast[] = [];

function emit() {
  for (const sub of subscribers) sub(queue);
}

export function showToast(message: string, tone: ToastTone = 'info', duration = 3200) {
  const id = `toast-${++nextId}`;
  const t: Toast = { id, message, tone };
  queue = [...queue, t];
  emit();
  if (typeof window !== 'undefined' && duration > 0) {
    window.setTimeout(() => dismissToast(id), duration);
  }
}

export function dismissToast(id: string) {
  queue = queue.filter(t => t.id !== id);
  emit();
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(queue);

  useEffect(() => {
    const sub = (next: Toast[]) => setToasts(next);
    subscribers.add(sub);
    return () => {
      subscribers.delete(sub);
    };
  }, []);

  const push = useCallback((message: string, tone: ToastTone = 'info') => {
    showToast(message, tone);
  }, []);

  const dismiss = useCallback((id: string) => {
    dismissToast(id);
  }, []);

  return { toasts, push, dismiss } as const;
}
