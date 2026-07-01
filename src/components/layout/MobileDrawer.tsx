'use client';

import { useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { usePathname, useRouter } from 'next/navigation';
import { X, Shield, Info } from 'lucide-react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useUser } from '@/hooks/useUser';
import { APP_VERSION, BUILD_TZ } from '@/lib/system-info';
import { NAV_ITEMS, isActivePath } from '@/lib/nav';
import { cn } from '@/lib/cn';
import { BrandLogo } from './BrandLogo';
import { useAppState } from './AppStateProvider';

const DRAWER_ID = 'mobile-hamburger-portal';
const DRAWER_TITLE_ID = 'mobile-drawer-title';

export function MobileDrawer() {
  const router = useRouter();
  const pathname = usePathname();
  const { isDrawerOpen, closeDrawer, savedCount } = useAppState();
  const user = useUser();
  const panelRef = useRef<HTMLDivElement>(null);

  useKeyboardShortcuts(
    isDrawerOpen ? [{ key: 'Escape', handler: () => closeDrawer() }] : [],
  );
  useBodyScrollLock(isDrawerOpen);
  useFocusTrap(panelRef, isDrawerOpen);
  const reduced = useReducedMotion();

  const handleSelect = (path: string) => {
    router.push(path);
    closeDrawer();
  };

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <div id={DRAWER_ID} className="fixed inset-0 z-50 md:hidden">
          <motion.div
            id="hamburger-backdrop"
            initial={reduced ? { opacity: 0.5 } : { opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={reduced ? { opacity: 0.5 } : { opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={closeDrawer}
            className="fixed inset-0 bg-black"
            aria-hidden="true"
          />

          <motion.div
            ref={panelRef}
            id="hamburger-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby={DRAWER_TITLE_ID}
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
                  onClick={closeDrawer}
                  aria-label="Close menu"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant text-secondary hover:text-on-surface hover:border-outline transition-all"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>

              <h3 id={DRAWER_TITLE_ID} className="visually-hidden">
                Primary navigation
              </h3>

              <span className="block font-mono text-[9px] font-bold tracking-widest text-secondary uppercase mb-4">
                Navigation Directory
              </span>

              <nav className="space-y-2" aria-label="Drawer primary navigation">
                {NAV_ITEMS.map(item => {
                  const isActive = isActivePath(pathname, item.path);
                  const showBadge = item.id === 'saved' && savedCount > 0;
                  const Icon = item.Icon;
                  return (
                    <button
                      key={item.id}
                      id={`hamburger-nav-${item.id}`}
                      type="button"
                      onClick={() => handleSelect(item.path)}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'w-full flex items-center justify-between p-3 rounded-lg border text-xs font-semibold uppercase tracking-wider transition-all',
                        isActive
                          ? 'bg-primary text-surface border-primary'
                          : 'border-outline-variant/60 bg-surface-container-low hover:border-outline text-secondary hover:text-on-surface',
                      )}
                    >
                      <span className="flex items-center space-x-2.5">
                        <Icon
                          size={16}
                          aria-hidden="true"
                          className={
                            isActive && item.id === 'saved'
                              ? 'fill-current'
                              : ''
                          }
                        />
                        <span>{item.drawerLabel}</span>
                      </span>
                      {showBadge && (
                        <span
                          aria-label={`${savedCount} spots saved`}
                          className={cn(
                            'px-2 py-0.5 text-[9px] font-mono font-bold rounded-full',
                            isActive
                              ? 'bg-surface text-primary'
                              : 'bg-primary text-surface',
                          )}
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
                    <span className="text-on-surface font-semibold">
                      {APP_VERSION}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-secondary">
                    <span className="uppercase">Radar Scope</span>
                    <span className="text-emerald-600 font-semibold flex items-center">
                      <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping mr-1"
                      />
                      Online
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-outline-variant pt-4 space-y-4">
              <div className="flex items-center space-x-3 p-1.5 rounded-lg">
                <div
                  className="h-9 w-9 rounded-full bg-on-surface text-surface text-xs font-bold font-mono flex items-center justify-center shadow-sm"
                  aria-label={user.name}
                >
                  {user.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-[10px] font-mono font-bold uppercase text-secondary">
                    Active Scout
                  </span>
                  <span className="block text-xs font-bold text-on-surface truncate">
                    {user.email}
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
                <span className="text-on-surface font-semibold uppercase">
                  {BUILD_TZ}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
