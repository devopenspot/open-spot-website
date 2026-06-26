import { useRef, type ReactNode } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { cn } from '../utils/cn';

interface OverlayProps {
  isOpen: boolean;
  onClose: () => void;
  labelledBy: string;
  /** id of the element that opened the overlay; passed back to focus on close. */
  contentId?: string;
  /** Backdrop click should close. Default true. */
  closeOnBackdrop?: boolean;
  /** Children content. */
  children: ReactNode;
  /** Extra className for the dialog panel. */
  panelClassName?: string;
  /** Optional className for the container element. */
  containerClassName?: string;
  /** ARIA role override. Default 'dialog'. */
  role?: 'dialog' | 'alertdialog';
  /** When true, the panel doesn't animate in. Useful for full-screen overlays. */
  flush?: boolean;
}

/**
 * Accessible overlay shell. Wraps focus trap, scroll lock, Esc handling,
 * click-outside, and a motion-respecting entry/exit animation.
 */
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
          <motion.div
            initial={reduced ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={reduced ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={closeOnBackdrop ? onClose : undefined}
            className="fixed inset-0 bg-black"
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role={role}
            aria-modal="true"
            aria-labelledby={labelledBy}
            tabIndex={-1}
            initial={reduced || flush ? false : { opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced || flush ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className={cn(
              'relative z-10 outline-none',
              flush ? 'flex h-full w-full flex-col' : 'mx-auto my-6 w-full max-w-3xl',
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
