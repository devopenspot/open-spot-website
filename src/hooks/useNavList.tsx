"use client";

import { useCallback, useMemo, useRef, type KeyboardEvent } from "react";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";
import { useUser } from "@/hooks/useUser";
import type { NavVariant } from "@/components/shell/NavLink";

interface UseNavListOptions {
  variant: NavVariant;
  onSelect: (path: string) => void;
}

export function useNavList({ variant, onSelect }: UseNavListOptions) {
  const pathname = usePathname();
  const listRef = useRef<HTMLDivElement>(null);
  const user = useUser();

  // Items flagged `adminOnly` are only shown to admins. Filter once per
  // render; the user rarely changes mid-session, so this is cheap.
  const navItems = useMemo(
    () => NAV_ITEMS.filter((item) => !item.adminOnly || user?.isAdmin === true),
    [user?.isAdmin],
  );

  const handleSelect = useCallback(
    (path: string) => () => onSelect(path),
    [onSelect],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const isTabVariant = variant !== "mobile-drawer";
      const allowedKeys = isTabVariant
        ? ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"]
        : ["ArrowUp", "ArrowDown", "Home", "End"];
      if (!allowedKeys.includes(e.key)) return;
      const buttons = Array.from(
        listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ??
          [],
      );
      if (buttons.length === 0) return;
      const currentIndex = buttons.findIndex(
        (b) => b === document.activeElement,
      );
      let nextIndex = currentIndex;
      if (e.key === "Home") nextIndex = 0;
      else if (e.key === "End") nextIndex = buttons.length - 1;
      else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        nextIndex = (currentIndex + 1) % buttons.length;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
      }
      e.preventDefault();
      buttons[nextIndex]?.focus();
    },
    [variant],
  );

  return { pathname, listRef, handleSelect, handleKeyDown, navItems };
}

interface RenderBadgeArgs {
  variant: NavVariant;
  id: string;
  savedCount: number;
}

export function renderNavBadge({ variant, id, savedCount }: RenderBadgeArgs) {
  if (id !== "saved" || savedCount <= 0) return undefined;
  if (variant === "mobile-drawer") {
    return (
      <span
        aria-label={`${savedCount} spots saved`}
        className="px-2 py-0.5 text-[9px] font-mono font-bold rounded-none-none bg-primary text-surface"
      >
        {savedCount}
      </span>
    );
  }
  if (variant === "mobile-tab") {
    return (
      <span
        aria-label={`${savedCount} spots saved`}
        className="absolute -top-1.5 -right-2 flex h-3.5 w-3.5 items-center justify-center rounded-none-none bg-primary text-[8px] font-bold text-surface animate-bounce"
      >
        {savedCount}
      </span>
    );
  }
  return (
    <span
      aria-label={`${savedCount} spots saved`}
      className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-none-none bg-primary px-1 text-[10px] font-bold text-surface"
    >
      {savedCount}
    </span>
  );
}

export function navLabelFor(
  item: (typeof NAV_ITEMS)[number],
  variant: NavVariant,
) {
  if (variant === "mobile-tab") return item.shortLabel;
  if (variant === "mobile-drawer") return item.drawerLabel;
  return item.label;
}
