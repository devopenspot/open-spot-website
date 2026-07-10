"use client";

import { isActivePath } from "@/lib/nav";
import { NavLink, type NavVariant } from "./NavLink";
import { navLabelFor, renderNavBadge, useNavList } from "@/hooks/useNavList";
import { cn } from "@/lib/cn";

interface NavListProps {
  variant: NavVariant;
  savedCount: number;
  controlsId?: string;
  onSelect: (path: string) => void;
}

const VARIANT_CONTAINER: Record<NavVariant, string> = {
  desktop: "hidden items-center space-x-1 md:flex",
  "mobile-tab":
    "fixed bottom-0 left-0 right-0 z-40 flex border-t border-outline-variant bg-surface px-2 py-2.5 md:hidden justify-around",
  "mobile-drawer": "space-y-2",
};

export function NavList({
  variant,
  savedCount,
  controlsId,
  onSelect,
}: NavListProps) {
  const { pathname, listRef, handleSelect, handleKeyDown, navItems } =
    useNavList({
      variant,
      onSelect,
    });

  const containerRole = variant === "mobile-drawer" ? undefined : "tablist";
  const containerLabel =
    variant === "mobile-drawer"
      ? "Drawer primary navigation"
      : "Primary navigation";
  const containerId =
    variant === "desktop"
      ? "desktop-nav"
      : variant === "mobile-tab"
        ? "mobile-nav"
        : undefined;
  const isDrawer = variant === "mobile-drawer";

  return (
    <div
      ref={listRef}
      id={containerId}
      role={containerRole}
      aria-label={containerLabel}
      onKeyDown={isDrawer ? undefined : handleKeyDown}
      className={cn(VARIANT_CONTAINER[variant])}
    >
      {navItems.map((item) => {
        const isActive = isActivePath(pathname, item.path);
        const showBadge = item.id === "saved" && savedCount > 0;
        const Icon = item.Icon;
        return (
          <NavLink
            key={item.id}
            tab={item.id}
            label={navLabelFor(item, variant)}
            icon={<Icon size={isDrawer ? 16 : 16} aria-hidden="true" />}
            active={isActive}
            variant={variant}
            controlsId={controlsId}
            onClick={handleSelect(item.path)}
            badge={
              showBadge
                ? renderNavBadge({ variant, id: item.id, savedCount })
                : undefined
            }
          />
        );
      })}
    </div>
  );
}
