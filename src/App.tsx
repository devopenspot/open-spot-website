import React, { useState, useEffect } from 'react';
import { INITIAL_SPOTS } from './data';
import { Spot, TabType } from './types';
import Header from './components/Header';
import ExploreTab from './components/ExploreTab';
import MapTab from './components/MapTab';
import SavedTab from './components/SavedTab';
import PostTab from './components/PostTab';
import SpotDetailsModal from './components/SpotDetailsModal';
import SearchOverlay from './components/SearchOverlay';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('explore');
  const [spots, setSpots] = useState<Spot[]>(INITIAL_SPOTS);
  const [savedSpotIds, setSavedSpotIds] = useState<Set<string>>(new Set<string>());
  
  // Modals / Overlays
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Synchronize saved spots with local storage on mount (optional/robust)
  useEffect(() => {
    const saved = localStorage.getItem('openspot_saved_ids');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as string[];
        setSavedSpotIds(new Set(parsed));
      } catch (e) {
        console.error('Error parsing saved ids:', e);
      }
    }
  }, []);

  const saveToLocalStorage = (newSet: Set<string>) => {
    localStorage.setItem('openspot_saved_ids', JSON.stringify(Array.from(newSet)));
  };

  // Keyboard Shortcuts (Cmd+K / Ctrl+K for search, Esc to dismiss)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setSelectedSpot(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Save/Unsave action
  const handleToggleSave = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Avoid triggering card selection click
    }
    setSavedSpotIds(prev => {
      const next = new Set<string>(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      saveToLocalStorage(next);
      return next;
    });
  };

  // Add new registered custom spot
  const handleAddSpot = (newSpot: Spot) => {
    setSpots(prev => [newSpot, ...prev]);
  };

  return (
    <div id="app-root" className="min-h-screen bg-surface font-sans text-on-surface flex flex-col selection:bg-primary selection:text-surface">
      
      {/* Universal Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        savedCount={savedSpotIds.size}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Main Content Pane */}
      <main id="main-content" className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
        {activeTab === 'explore' && (
          <ExploreTab
            spots={spots}
            savedSpotIds={savedSpotIds}
            onSelectSpot={setSelectedSpot}
            onToggleSave={handleToggleSave}
            onNavigateToMap={() => setActiveTab('map')}
          />
        )}

        {activeTab === 'map' && (
          <MapTab
            spots={spots}
            savedSpotIds={savedSpotIds}
            onSelectSpot={setSelectedSpot}
            onToggleSave={handleToggleSave}
          />
        )}

        {activeTab === 'saved' && (
          <SavedTab
            spots={spots}
            savedSpotIds={savedSpotIds}
            onSelectSpot={setSelectedSpot}
            onToggleSave={handleToggleSave}
            onNavigateToExplore={() => setActiveTab('explore')}
          />
        )}

        {activeTab === 'post' && (
          <PostTab
            onAddSpot={handleAddSpot}
            onNavigateToExplore={() => setActiveTab('explore')}
          />
        )}
      </main>

      {/* Expanded Spot Spotlight Modal Overlay */}
      {selectedSpot && (
        <SpotDetailsModal
          spot={selectedSpot}
          onClose={() => setSelectedSpot(null)}
          onToggleSave={(id) => handleToggleSave(id)}
          isSaved={savedSpotIds.has(selectedSpot.id)}
        />
      )}

      {/* Fullscreen Search Console Overlay */}
      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        spots={spots}
        onSelectSpot={setSelectedSpot}
      />
    </div>
  );
}
