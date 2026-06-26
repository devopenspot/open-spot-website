'use client';

import { useRef, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { cn } from '@/lib/cn';

interface OverlayProps {
  isOpen: boolean;
  onClose: () => void;
  labelledBy: string;
  contentId?: string;
  closeOnBackdrop?: boolean;
  children: ReactNode;
  panelClassName?: string;
  containerClassName?: string;
  role?: 'dialog' | 'alertdialog';
  flush?: boolean;
  hideBackdrop?: boolean;
}

export function Overlay({
  isOpen,
  onClose,
  labelledBy,
  contentId,
  closeOnBackdrop = true,
  children,
  panelClassName,
  containerClassName,
  role = 'dialog',
  flush = false,
  hideBackdrop = false,
}: OverlayProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, isOpen);
  useEscapeKey(onClose, isOpen);
  useBodyScrollLock(isOpen);
  const reduced = useReducedMotion();

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id={contentId}
          className={cn('fixed inset-0 z-50', containerClassName)}
        >
          {!hideBackdrop && (
            <motion.div
              initial={reduced ? { opacity: 0.5 } : { opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={reduced ? { opacity: 0.5 } : { opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={closeOnBackdrop ? onClose : undefined}
              className="fixed inset-0 bg-black"
              aria-hidden="true"
            />
          )}
          <motion.div
            ref={panelRef}
            role={role}
            aria-modal="true"
            aria-labelledby={labelledBy}
            tabIndex={-1}
            initial={
              reduced || flush ? false : { opacity: 0, y: 24, scale: 0.97 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              reduced || flush
                ? { opacity: 0 }
                : { opacity: 0, y: 24, scale: 0.97 }
            }
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className={cn(
              'relative z-10 outline-none',
              flush
                ? 'flex h-full w-full flex-col'
                : 'mx-auto my-6 w-full max-w-3xl',
              panelClassName,
            )}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
