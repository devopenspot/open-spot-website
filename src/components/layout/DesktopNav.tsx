'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from '@/lib/nav';
import { NavLink } from './NavLink';

interface DesktopNavProps {
  savedCount: number;
  controlsId: string;
  onSelect: (path: string) => void;
}

export function DesktopNav({ savedCount, controlsId, onSelect }: DesktopNavProps) {
  const pathname = usePathname();
  const listRef = useRef<HTMLDivElement>(null);

  const handleSelect = useCallback(
    (path: string) => () => onSelect(path),
    [onSelect],
  );

  // Roving tabindex: arrow keys move focus between tabs.
  // Home/End jump to first/last. Per WAI-ARIA Authoring Practices.
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (
        !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(
          e.key,
        )
      ) {
        return;
      }
      const buttons = Array.from(
        listRef.current?.querySelectorAll<HTMLButtonElement>(
          '[role="tab"]',
        ) ?? [],
      );
      if (buttons.length === 0) return;
      const currentIndex = buttons.findIndex(
        b => b === document.activeElement,
      );
      let nextIndex = currentIndex;
      if (e.key === 'Home') nextIndex = 0;
      else if (e.key === 'End') nextIndex = buttons.length - 1;
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown')
        nextIndex = (currentIndex + 1) % buttons.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp')
        nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
      e.preventDefault();
      const next = buttons[nextIndex];
      next?.focus();
    },
    [],
  );

  useEffect(() => {
    // When the active route changes via keyboard nav, ensure the active
    // button is in the tab order (roving tabindex handles this on focus
    // but we keep a single source of truth via the active prop).
  }, [pathname]);

  return (
    <div
      ref={listRef}
      id="desktop-nav"
      role="tablist"
      aria-label="Primary navigation"
      onKeyDown={handleKeyDown}
      className="hidden items-center space-x-1 md:flex"
    >
      {NAV_ITEMS.map(item => {
        const isActive =
          item.path === '/'
            ? pathname === '/'
            : pathname === item.path || pathname.startsWith(`${item.path}/`);
        const showBadge = item.id === 'saved' && savedCount > 0;
        const Icon = item.Icon;
        return (
          <NavLink
            key={item.id}
            tab={item.id}
            label={item.label}
            icon={<Icon size={16} aria-hidden="true" />}
            active={isActive}
            variant="desktop"
            controlsId={controlsId}
            onClick={handleSelect(item.path)}
            badge={
              showBadge ? (
                <span
                  aria-label={`${savedCount} spots saved`}
                  className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-surface"
                >
                  {savedCount}
                </span>
              ) : undefined
            }
          />
        );
      })}
    </div>
  );
}
