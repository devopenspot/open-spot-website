import { useCallback } from 'react';
import { Compass, Map, Heart, PlusCircle } from 'lucide-react';
import { TabType } from '../types';
import { NavLink } from './NavLink';

interface DesktopNavProps {
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
  map: 'Spot Map',
  saved: 'Saved',
  post: 'Post Spot',
};

const ORDER: TabType[] = ['explore', 'map', 'saved', 'post'];

export function DesktopNav({ activeTab, onSelect, savedCount, controlsId }: DesktopNavProps) {
  const handleSelect = useCallback(
    (tab: TabType) => () => onSelect(tab),
    [onSelect],
  );

  return (
    <nav
      id="desktop-nav"
      role="tablist"
      aria-label="Primary navigation"
      className="hidden items-center space-x-1 md:flex"
    >
      {ORDER.map(tab => {
        const Icon = ICONS[tab];
        const showBadge = tab === 'saved' && savedCount > 0;
        return (
          <NavLink
            key={tab}
            tab={tab}
            label={LABELS[tab]}
            icon={<Icon size={16} />}
            active={activeTab === tab}
            variant="desktop"
            controlsId={controlsId}
            onClick={handleSelect(tab)}
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
    </nav>
  );
}
