'use client';

import { Menu } from 'lucide-react';
import { useAppState } from './AppStateProvider';

export function MobileDrawerTrigger() {
  const { openDrawer } = useAppState();
  return (
    <button
      id="mobile-hamburger-btn"
      type="button"
      onClick={openDrawer}
      aria-label="Open menu"
      aria-controls="mobile-hamburger-portal"
      className="flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant text-secondary hover:text-on-surface hover:border-outline md:hidden transition-all bg-surface-bright"
    >
      <Menu size={18} aria-hidden="true" />
    </button>
  );
}
