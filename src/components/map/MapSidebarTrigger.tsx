"use client";

import { memo, useCallback } from "react";
import { PanelLeft } from "lucide-react";
import { cn } from "@/lib/cn";

export const MAP_SIDEBAR_TRIGGER_ID = "map-sidebar-trigger-btn";
export const MAP_SIDEBAR_PANEL_ID = "map-sidebar-drawer-panel";

interface MapSidebarTriggerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
}

function MapSidebarTriggerBase({
  isOpen,
  onOpenChange,
  className,
}: MapSidebarTriggerProps) {
  const toggle = useCallback(
    () => onOpenChange(!isOpen),
    [isOpen, onOpenChange],
  );

  return (
    <button
      id={MAP_SIDEBAR_TRIGGER_ID}
      type="button"
      onClick={toggle}
      aria-label={isOpen ? "Hide spot list" : "Show spot list"}
      aria-expanded={isOpen}
      aria-controls={MAP_SIDEBAR_PANEL_ID}
      className={cn(
        "fixed top-20 left-3 z-[1001] flex h-8 w-8 items-center justify-center border border-secondary bg-surface backdrop-blur-md text-black hover:text-on-surface hover:border-outline transition-all",
        className,
      )}
    >
      <PanelLeft size={18} aria-hidden="true" />
    </button>
  );
}

export const MapSidebarTrigger = memo(MapSidebarTriggerBase);
