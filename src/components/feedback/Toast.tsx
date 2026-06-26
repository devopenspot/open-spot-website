'use client';

import { CheckCircle2, Info, XCircle, X } from 'lucide-react';
import { useToast, type Toast, type ToastTone } from '@/hooks/useToast';
import { cn } from '@/lib/cn';

const TONE_STYLES: Record<ToastTone, { ring: string; icon: React.ReactNode; label: string }> = {
  info: {
    ring: 'border-on-surface/15',
    icon: <Info size={14} aria-hidden="true" className="text-on-surface" />,
    label: 'Info',
  },
  success: {
    ring: 'border-on-surface/20',
    icon: <CheckCircle2 size={14} aria-hidden="true" className="text-on-surface" />,
    label: 'Success',
  },
  error: {
    ring: 'border-error/40',
    icon: <XCircle size={14} aria-hidden="true" className="text-error" />,
    label: 'Error',
  },
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const style = TONE_STYLES[toast.tone];
  return (
    <div
      role={toast.tone === 'error' ? 'alert' : 'status'}
      aria-live={toast.tone === 'error' ? 'assertive' : 'polite'}
      className={cn(
        'pointer-events-auto flex items-center space-x-3 rounded-lg border bg-surface px-4 py-3 shadow-lg',
        style.ring,
      )}
    >
      <span className="shrink-0">{style.icon}</span>
      <span className="text-xs font-medium text-on-surface">{toast.message}</span>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="ml-2 shrink-0 rounded p-1 text-secondary hover:bg-surface-container hover:text-on-surface transition-colors"
      >
        <X size={12} aria-hidden="true" />
      </button>
      <span className="visually-hidden">{style.label}</span>
    </div>
  );
}

export function ToastViewport() {
  const { toasts, dismiss } = useToast();
  if (toasts.length === 0) return null;
  return (
    <div
      aria-label="Notifications"
      className="pointer-events-none fixed bottom-20 left-1/2 z-[100] flex w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 flex-col items-stretch gap-2 md:bottom-6"
    >
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </div>
  );
}
