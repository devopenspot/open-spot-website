import { useCallback, useEffect, useMemo, useState, useTransition, type ReactNode } from 'react';
import { INITIAL_SPOTS } from './data';
import { Spot, TabType } from './types';
import Header from './components/Header';
import ExploreTab from './components/ExploreTab';
import MapTab from './components/MapTab';
import SavedTab from './components/SavedTab';
import PostTab from './components/PostTab';
import SpotDetailsModal from './components/SpotDetailsModal';
import SearchOverlay from './components/SearchOverlay';
import { ToastViewport } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useSavedSpots } from './hooks/useSavedSpots';
import { useEscapeKey } from './hooks/useEscapeKey';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { showToast } from './hooks/useToast';

export default function App() {
  const [activeTab, setActiveTabRaw] = useState<TabType>('explore');
  const [, startTabTransition] = useTransition();
  const [spots, setSpots] = useState<Spot[]>(INITIAL_SPOTS);

  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const { savedIds, isSaved, toggle, count, lastError } = useSavedSpots();

  useEffect(() => {
    if (lastError) {
      showToast('Could not save your bookmarks locally', 'error');
    }
  }, [lastError]);

  const closeModal = useCallback(() => setSelectedSpot(null), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);
  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const toggleSearch = useCallback(() => setIsSearchOpen(prev => !prev), []);

  useEscapeKey(closeModal, Boolean(selectedSpot));
  useEscapeKey(closeSearch, isSearchOpen);

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

  const setActiveTab = useCallback(
    (tab: TabType) => {
      startTabTransition(() => setActiveTabRaw(tab));
    },
    [startTabTransition],
  );

  const handleToggleSave = useCallback(
    (id: string) => {
      toggle(id);
    },
    [toggle],
  );

  const handleAddSpot = useCallback((newSpot: Spot) => {
    setSpots(prev => [newSpot, ...prev]);
  }, []);

  const tabs = useMemo<Record<TabType, ReactNode>>(
    () => ({
      explore: (
        <ExploreTab
          spots={spots}
          savedSpotIds={savedIds}
          onSelectSpot={setSelectedSpot}
          onToggleSave={handleToggleSave}
          onNavigateToMap={() => setActiveTab('map')}
        />
      ),
      map: (
        <MapTab
          spots={spots}
          savedSpotIds={savedIds}
          onSelectSpot={setSelectedSpot}
          onToggleSave={handleToggleSave}
        />
      ),
      saved: (
        <SavedTab
          spots={spots}
          savedSpotIds={savedIds}
          onSelectSpot={setSelectedSpot}
          onToggleSave={handleToggleSave}
          onNavigateToExplore={() => setActiveTab('explore')}
        />
      ),
      post: (
        <PostTab
          onAddSpot={handleAddSpot}
          onNavigateToExplore={() => setActiveTab('explore')}
        />
      ),
    }),
    [spots, savedIds, handleToggleSave, handleAddSpot, setActiveTab],
  );

  return (
    <div
      id="app-root"
      className="min-h-screen bg-surface font-sans text-on-surface flex flex-col selection:bg-primary selection:text-surface"
    >
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        savedCount={count}
        onOpenSearch={openSearch}
      />

      <main
        id="main-content"
        aria-label="Open Spot content"
        className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 md:px-8"
      >
        <ErrorBoundary>{tabs[activeTab]}</ErrorBoundary>
      </main>

      {selectedSpot && (
        <SpotDetailsModal
          spot={selectedSpot}
          onClose={closeModal}
          onToggleSave={handleToggleSave}
          isSaved={isSaved(selectedSpot.id)}
        />
      )}

      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={closeSearch}
        spots={spots}
        onSelectSpot={setSelectedSpot}
      />

      <ToastViewport />
    </div>
  );
}
