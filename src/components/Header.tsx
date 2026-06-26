import { useState } from 'react';
import { Menu } from 'lucide-react';
import { TabType } from '../types';
import { BrandLogo } from './BrandLogo';
import { SearchTrigger } from './SearchTrigger';
import { DesktopNav } from './DesktopNav';
import { MobileNav } from './MobileNav';
import { MobileDrawer } from './MobileDrawer';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  savedCount: number;
  onOpenSearch: () => void;
}

const PANEL_ID = 'main-content';

export default function Header({
  activeTab,
  setActiveTab,
  savedCount,
  onOpenSearch,
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header
      id="app-header"
      className="sticky top-0 z-40 w-full border-b border-outline-variant bg-surface px-4 py-3 md:px-8"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <BrandLogo onClick={() => setActiveTab('explore')} />

        <DesktopNav
          activeTab={activeTab}
          onSelect={setActiveTab}
          savedCount={savedCount}
          controlsId={PANEL_ID}
        />

        <div id="header-actions" className="flex items-center space-x-3">
          <SearchTrigger onClick={onOpenSearch} />

          <div
            id="user-avatar"
            aria-hidden="true"
            className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-on-surface text-surface text-xs font-bold font-mono"
          >
            OS
          </div>

          <button
            id="mobile-hamburger-btn"
            type="button"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-hamburger-portal"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant text-secondary hover:text-on-surface hover:border-outline md:hidden transition-all bg-surface-bright"
          >
            <Menu size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      <MobileNav
        activeTab={activeTab}
        onSelect={setActiveTab}
        savedCount={savedCount}
        controlsId={PANEL_ID}
      />

      <MobileDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        activeTab={activeTab}
        onSelect={setActiveTab}
        savedCount={savedCount}
        drawerId="mobile-hamburger-portal"
        titleId="mobile-drawer-title"
      />
    </header>
  );
}
