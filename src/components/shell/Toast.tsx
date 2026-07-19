'use client';

import { X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useToast, type Toast, type ToastTone } from '@/hooks/useToast';
import { cn } from '@/lib/cn';

const TONE_TAG: Record<ToastTone, string> = {
  info: 'INFO',
  success: 'OK',
  error: 'ERR',
};

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
  index: number;
}

function ToastItem({ toast, onDismiss, index }: ToastItemProps) {
  const reduced = useReducedMotion();
  const isError = toast.tone === 'error';

  return (
    <motion.div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      aria-atomic="true"
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
      transition={{
        duration: 0.16,
        ease: 'easeOut',
        delay: reduced ? 0 : index * 0.04,
      }}
      className={cn(
        'pointer-events-auto relative flex items-stretch border border-on-surface bg-surface',
        isError && 'border-l-2',
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3">
        <span
          aria-hidden="true"
          className="shrink-0 font-mono text-[10px] font-bold tracking-widest text-on-surface uppercase"
        >
          [ {TONE_TAG[toast.tone]} ]
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          {toast.title ? (
            <span className="font-display text-xs font-bold tracking-widest text-on-surface uppercase">
              {toast.title}
            </span>
          ) : null}
          <span
            className={cn(
              'min-w-0 text-xs text-on-surface',
              toast.title ? 'font-normal' : 'font-semibold',
            )}
          >
            {toast.message}
          </span>
        </div>
        {toast.action ? (
          <button
            type="button"
            onClick={() => {
              toast.action?.onClick();
              onDismiss(toast.id);
            }}
            className="shrink-0 font-mono text-[10px] font-bold tracking-widest text-on-surface uppercase underline underline-offset-2 hover:text-primary focus-visible:text-primary"
          >
            {toast.action.label}
          </button>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="flex shrink-0 items-center justify-center border-l border-on-surface px-3 text-on-surface hover:bg-surface-container focus-visible:bg-surface-container transition-colors"
      >
        <X size={12} aria-hidden="true" />
      </button>
    </motion.div>
  );
}

export function ToastViewport() {
  const { toasts, overflow, dismiss } = useToast();
  if (toasts.length === 0 && overflow === 0) return null;

  return (
    <div
      aria-label="Notifications"
      role="region"
      className="pointer-events-none fixed bottom-[calc(var(--mobile-nav-h,80px)+1rem)] left-1/2 z-[1100] flex w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 flex-col items-stretch gap-2 md:bottom-6"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t, i) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} index={i} />
        ))}
      </AnimatePresence>
      {overflow > 0 ? (
        <div
          aria-live="polite"
          className="pointer-events-auto self-center border border-on-surface bg-surface px-3 py-1 font-mono text-[10px] font-bold tracking-widest text-on-surface uppercase"
        >
          +{overflow} more
        </div>
      ) : null}
    </div>
  );
}
