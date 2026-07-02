'use client';

import { useRouter } from 'next/navigation';
import { BrandLogo } from './BrandLogo';
import { NavList } from './NavList';
import { MobileDrawerTrigger } from './MobileDrawerTrigger';
import { SearchTrigger } from './SearchTrigger';
import { useUIStore } from '@/stores/ui-store';
import { useSavedSpots } from '@/hooks/useSavedSpots';
import { useUser } from '@/hooks/useUser';
import { MAIN_CONTENT_ID } from '@/lib/constants';

export function Header() {
  const router = useRouter();
  const openSearch = useUIStore((s) => s.openSearch);
  const user = useUser();
  const { count: savedCount } = useSavedSpots(user.id);

  const handleSelect = (path: string) => {
    router.push(path);
  };

  return (
    <header
      id="app-header"
      className="sticky top-0 z-40 w-full border-b border-outline-variant bg-surface px-4 py-3 md:px-8"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <BrandLogo />

        <NavList
          variant="desktop"
          savedCount={savedCount}
          controlsId={MAIN_CONTENT_ID}
          onSelect={handleSelect}
        />

        <div id="header-actions" className="flex items-center space-x-3">
          <SearchTrigger onClick={openSearch} />

          <div
            id="user-avatar"
            aria-label={user.name}
            title={user.email}
            className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-on-surface text-surface text-xs font-bold font-mono"
          >
            {user.initials}
          </div>

          <MobileDrawerTrigger />
        </div>
      </div>

      <NavList
        variant="mobile-tab"
        savedCount={savedCount}
        controlsId={MAIN_CONTENT_ID}
        onSelect={handleSelect}
      />
    </header>
  );
}
