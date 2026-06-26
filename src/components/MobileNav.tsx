import { useCallback } from 'react';
import { Compass, Map, Heart, PlusCircle } from 'lucide-react';
import { TabType } from '../types';
import { NavLink } from './NavLink';

interface MobileNavProps {
  activeTab: TabType;
  onSelect: (tab: TabType) => void;
  savedCount: number;
  controlsId: string;
}

const ICONS: Record<TabType, typeof Compass> = {
  explore: Compass,
  map: Map,
  saved: Heart,
  post: PlusCircle,
};

const LABELS: Record<TabType, string> = {
  explore: 'Explore',
  map: 'Map',
  saved: 'Saved',
  post: 'Post Spot',
};

const ORDER: TabType[] = ['explore', 'map', 'saved', 'post'];

export function MobileNav({ activeTab, onSelect, savedCount, controlsId }: MobileNavProps) {
  const handleSelect = useCallback(
    (tab: TabType) => () => onSelect(tab),
    [onSelect],
  );

  return (
    <nav
      id="mobile-nav"
      role="tablist"
      aria-label="Primary navigation"
      className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-outline-variant bg-surface px-2 py-2.5 md:hidden justify-around"
    >
      {ORDER.map(tab => {
        const Icon = ICONS[tab];
        const showBadge = tab === 'saved' && savedCount > 0;
        return (
          <NavLink
            key={tab}
            tab={tab}
            label={LABELS[tab]}
            icon={<Icon size={18} />}
            active={activeTab === tab}
            variant="mobile-tab"
            controlsId={controlsId}
            onClick={handleSelect(tab)}
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
    </nav>
  );
}
