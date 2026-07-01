'use client';

import { useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS, isActivePath } from '@/lib/nav';
import { NavLink } from './NavLink';

interface MobileNavProps {
  savedCount: number;
  controlsId: string;
  onSelect: (path: string) => void;
}

export function MobileNav({ savedCount, controlsId, onSelect }: MobileNavProps) {
  const pathname = usePathname();
  const listRef = useRef<HTMLDivElement>(null);

  const handleSelect = useCallback(
    (path: string) => () => onSelect(path),
    [onSelect],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (
        !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)
      ) {
        return;
      }
      const buttons = Array.from(
        listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ??
          [],
      );
      if (buttons.length === 0) return;
      const currentIndex = buttons.findIndex(
        b => b === document.activeElement,
      );
      let nextIndex = currentIndex;
      if (e.key === 'Home') nextIndex = 0;
      else if (e.key === 'End') nextIndex = buttons.length - 1;
      else if (e.key === 'ArrowRight')
        nextIndex = (currentIndex + 1) % buttons.length;
      else if (e.key === 'ArrowLeft')
        nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
      e.preventDefault();
      const next = buttons[nextIndex];
      next?.focus();
    },
    [],
  );

  return (
    <div
      ref={listRef}
      id="mobile-nav"
      role="tablist"
      aria-label="Primary navigation"
      onKeyDown={handleKeyDown}
      className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-outline-variant bg-surface px-2 py-2.5 md:hidden justify-around"
    >
      {NAV_ITEMS.map(item => {
        const isActive = isActivePath(pathname, item.path);
        const showBadge = item.id === 'saved' && savedCount > 0;
        const Icon = item.Icon;
        return (
          <NavLink
            key={item.id}
            tab={item.id}
            label={item.shortLabel}
            icon={<Icon size={18} aria-hidden="true" />}
            active={isActive}
            variant="mobile-tab"
            controlsId={controlsId}
            onClick={handleSelect(item.path)}
            badge={
              showBadge ? (
                <span
                  aria-label={`${savedCount} spots saved`}
                  className="absolute -top-1.5 -right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-surface animate-bounce"
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
