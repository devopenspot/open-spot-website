"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { MapSidebarContent } from "./MapSidebar";
import { MAP_SIDEBAR_PANEL_ID } from "./MapSidebarTrigger";
import type { Spot } from "@/lib/types";
import { cn } from "@/lib/cn";

const DRAWER_TITLE_ID = "map-sidebar-drawer-title";
const CLOSE_BTN_ID = "map-sidebar-drawer-close-btn";
const EMPTY_SHORTCUTS: { key: string; handler: () => void }[] = [];

interface MapSidebarDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  spots: readonly Spot[];
  onSelect: (spot: Spot) => void;
  className?: string;
}

export function MapSidebarDrawer({
  isOpen,
  onOpenChange,
  spots,
  onSelect,
  className,
}: MapSidebarDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);
  const reducedMotion = useReducedMotion();
  const pathname = usePathname();
  const shortcuts = useMemo(
    () => (isOpen ? [{ key: "Escape", handler: close }] : EMPTY_SHORTCUTS),
    [isOpen, close],
  );

  useBodyScrollLock(isOpen);
  useFocusTrap(panelRef, isOpen);
  useKeyboardShortcuts(shortcuts);

  useEffect(() => {
    onOpenChange(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className={cn("fixed inset-0 z-[1200] lg:hidden", className)}
          data-testid="map-sidebar-drawer"
        >
          <motion.div
            className="absolute inset-0 bg-black"
            initial={reducedMotion ? { opacity: 0.5 } : { opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={close}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            id={MAP_SIDEBAR_PANEL_ID}
            role="dialog"
            aria-modal="true"
            aria-labelledby={DRAWER_TITLE_ID}
            tabIndex={-1}
            className="absolute inset-y-0 left-0 w-80 max-w-[calc(100vw-2rem)] bg-surface-bright border-r border-outline-variant flex flex-col shadow-none-none outline-none"
            initial={reducedMotion ? { opacity: 0 } : { x: "-100%" }}
            animate={reducedMotion ? { opacity: 1 } : { x: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { x: "-100%" }}
            transition={
              reducedMotion
                ? { duration: 0.18 }
                : { type: "spring", damping: 30, stiffness: 320 }
            }
          >
            <h2 id={DRAWER_TITLE_ID} className="visually-hidden">
              Spot list
            </h2>
            <MapSidebarContent
              spots={spots}
              onSelect={onSelect}
              headerExtras={
                <button
                  id={CLOSE_BTN_ID}
                  type="button"
                  onClick={close}
                  aria-label="Close spot list"
                  className="flex h-8 w-8 items-center justify-center border border-outline-variant text-secondary hover:text-on-surface hover:border-outline transition-all bg-surface-bright"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              }
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
