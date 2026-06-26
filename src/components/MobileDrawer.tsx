import { useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Compass, Map, Heart, PlusCircle, X, Shield, Info } from 'lucide-react';
import { TabType } from '../types';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { BrandLogo } from './BrandLogo';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: TabType;
  onSelect: (tab: TabType) => void;
  savedCount: number;
  drawerId: string;
  titleId: string;
}

const ICONS: Record<TabType, typeof Compass> = {
  explore: Compass,
  map: Map,
  saved: Heart,
  post: PlusCircle,
};

const LABELS: Record<TabType, string> = {
  explore: 'Explore Archive',
  map: 'Spot Map',
  saved: 'Saved Locations',
  post: 'Register Plot',
};

const ORDER: TabType[] = ['explore', 'map', 'saved', 'post'];

export function MobileDrawer({
  isOpen,
  onClose,
  activeTab,
  onSelect,
  savedCount,
  drawerId,
  titleId,
}: MobileDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useEscapeKey(onClose, isOpen);
  useBodyScrollLock(isOpen);
  useFocusTrap(panelRef, isOpen);
  const reduced = useReducedMotion();

  // Focus the close button when opening
  useEffect(() => {
    if (!isOpen) return;
    const id = window.setTimeout(() => {
      const close = panelRef.current?.querySelector<HTMLButtonElement>('#close-hamburger-btn');
      close?.focus();
    }, 50);
    return () => window.clearTimeout(id);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div id={drawerId} className="fixed inset-0 z-50 md:hidden">
          <motion.div
            id="hamburger-backdrop"
            initial={reduced ? { opacity: 0.5 } : { opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={reduced ? { opacity: 0.5 } : { opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-black"
            aria-hidden="true"
          />

          <motion.div
            ref={panelRef}
            id="hamburger-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={reduced ? { x: 0 } : { x: '100%' }}
            animate={{ x: 0 }}
            exit={reduced ? { x: 0 } : { x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-72 bg-surface text-on-surface border-l border-outline-variant flex flex-col p-6 shadow-2xl justify-between"
          >
            <div>
              <div className="flex items-center justify-between border-b border-outline-variant pb-4 mb-6">
                <BrandLogo size="sm" />
                <button
                  id="close-hamburger-btn"
                  type="button"
                  onClick={onClose}
                  aria-label="Close menu"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant text-secondary hover:text-on-surface hover:border-outline transition-all"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>

              <h3 id={titleId} className="visually-hidden">Primary navigation</h3>

              <span className="block font-mono text-[9px] font-bold tracking-widest text-secondary uppercase mb-4">
                Navigation Directory
              </span>

              <nav className="space-y-2" aria-label="Drawer primary navigation">
                {ORDER.map(tab => {
                  const Icon = ICONS[tab];
                  const isActive = activeTab === tab;
                  const showBadge = tab === 'saved' && savedCount > 0;
                  return (
                    <button
                      key={tab}
                      id={`hamburger-nav-${tab}`}
                      type="button"
                      onClick={() => {
                        onSelect(tab);
                        onClose();
                      }}
                      aria-current={isActive ? 'page' : undefined}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border text-xs font-semibold uppercase tracking-wider transition-all ${
                        isActive
                          ? 'bg-primary text-surface border-primary'
                          : 'border-outline-variant/60 bg-surface-container-low hover:border-outline text-secondary hover:text-on-surface'
                      }`}
                    >
                      <span className="flex items-center space-x-2.5">
                        <Icon
                          size={16}
                          aria-hidden="true"
                          className={isActive && tab === 'saved' ? 'fill-current' : ''}
                        />
                        <span>{LABELS[tab]}</span>
                      </span>
                      {showBadge && (
                        <span
                          aria-label={`${savedCount} spots saved`}
                          className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded-full ${
                            isActive ? 'bg-surface text-primary' : 'bg-primary text-surface'
                          }`}
                        >
                          {savedCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              <div className="mt-8">
                <span className="block font-mono text-[9px] font-bold tracking-widest text-secondary uppercase mb-3">
                  System Status
                </span>
                <div className="space-y-2 rounded-xl border border-outline-variant/60 bg-surface-container-low p-3.5">
                  <div className="flex items-center justify-between text-[10px] font-mono text-secondary">
                    <span className="uppercase">Grid Version</span>
                    <span className="text-on-surface font-semibold">V2.4.0</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-secondary">
                    <span className="uppercase">Radar Scope</span>
                    <span className="text-emerald-600 font-semibold flex items-center">
                      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping mr-1" />
                      Online
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-outline-variant pt-4 space-y-4">
              <div className="flex items-center space-x-3 p-1.5 rounded-lg">
                <div className="h-9 w-9 rounded-full bg-on-surface text-surface text-xs font-bold font-mono flex items-center justify-center shadow-sm" aria-hidden="true">
                  OS
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-[10px] font-mono font-bold uppercase text-secondary">
                    Active Scout
                  </span>
                  <span className="block text-xs font-bold text-on-surface truncate">
                    devopenspot@gmail.com
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[9px] font-mono text-secondary px-1">
                <span className="hover:text-on-surface cursor-pointer uppercase flex items-center">
                  <Shield size={10} className="mr-1" aria-hidden="true" /> Rules
                </span>
                <span className="hover:text-on-surface cursor-pointer uppercase flex items-center">
                  <Info size={10} className="mr-1" aria-hidden="true" /> Intel
                </span>
                <span className="text-on-surface font-semibold uppercase">UTC -07:00</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
