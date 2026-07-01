'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Header } from './Header';
import { MobileDrawer } from './MobileDrawer';
import { SearchOverlay } from '@/components/search/SearchOverlay';
import { ToastViewport } from '@/components/feedback/Toast';
import { useAppState } from './AppStateProvider';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { MAIN_CONTENT_ID } from '@/lib/constants';
import { ROUTES } from '@/lib/nav';
import type { Spot } from '@/lib/types';

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { toggleSearch, closeSearch, isSearchOpen, spots } = useAppState();
  const pathname = usePathname();

  // Close the search overlay on route change
  useEffect(() => {
    if (isSearchOpen) closeSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useKeyboardShortcuts([
    {
      key: 'k',
      cmdOrCtrl: true,
      handler: e => {
        e.preventDefault();
        toggleSearch();
      },
    },
  ]);

  const handleSelectSpot = (spot: Spot) => {
    router.push(ROUTES.spot(spot.id));
  };

  return (
    <div
      id="app-root"
      className="min-h-screen bg-surface font-sans text-on-surface flex flex-col selection:bg-primary selection:text-surface"
    >
      <a href={`#${MAIN_CONTENT_ID}`} className="skip-link">
        Skip to main content
      </a>

      <Header />

      <main
        id={MAIN_CONTENT_ID}
        aria-label="Open Spot content"
        className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 md:px-8"
      >
        {children}
      </main>

      <MobileDrawer />
      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={closeSearch}
        spots={spots}
        onSelectSpot={handleSelectSpot}
      />
      <ToastViewport />
    </div>
  );
}
