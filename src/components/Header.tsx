import React, { useState } from 'react';
import { Compass, Heart, Map, PlusCircle, Search, Menu, X, Shield, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TabType } from '../types';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  savedCount: number;
  onOpenSearch: () => void;
}

export default function Header({
  activeTab,
  setActiveTab,
  savedCount,
  onOpenSearch,
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  return (
    <header id="app-header" className="sticky top-0 z-40 w-full border-b border-outline-variant bg-surface px-4 py-3 md:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Brand Logo */}
        <div 
          id="brand-logo" 
          className="flex cursor-pointer items-center space-x-2"
          onClick={() => setActiveTab('explore')}
        >
          <span className="font-display text-xl font-bold tracking-widest text-on-surface uppercase sm:text-2xl">
            OPEN SPOT
          </span>
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        </div>

        {/* Desktop Navigation */}
        <nav id="desktop-nav" className="hidden items-center space-x-1 md:flex">
          <button
            id="nav-btn-explore"
            onClick={() => setActiveTab('explore')}
            className={`flex items-center space-x-2 px-3 py-1.5 text-sm font-medium transition-all ${
              activeTab === 'explore'
                ? 'border-b-2 border-primary text-primary'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            <Compass size={16} />
            <span>Explore</span>
          </button>

          <button
            id="nav-btn-map"
            onClick={() => setActiveTab('map')}
            className={`flex items-center space-x-2 px-3 py-1.5 text-sm font-medium transition-all ${
              activeTab === 'map'
                ? 'border-b-2 border-primary text-primary'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            <Map size={16} />
            <span>Spot Map</span>
          </button>

          <button
            id="nav-btn-saved"
            onClick={() => setActiveTab('saved')}
            className={`flex items-center space-x-2 px-3 py-1.5 text-sm font-medium transition-all ${
              activeTab === 'saved'
                ? 'border-b-2 border-primary text-primary'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            <div className="relative">
              <Heart size={16} className={activeTab === 'saved' ? 'fill-primary text-primary' : ''} />
              {savedCount > 0 && (
                <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-surface">
                  {savedCount}
                </span>
              )}
            </div>
            <span>Saved</span>
          </button>

          <button
            id="nav-btn-post"
            onClick={() => setActiveTab('post')}
            className={`flex items-center space-x-2 px-3 py-1.5 text-sm font-medium transition-all ${
              activeTab === 'post'
                ? 'border-b-2 border-primary text-primary'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            <PlusCircle size={16} />
            <span>Post Spot</span>
          </button>
        </nav>

        {/* Action Items */}
        <div id="header-actions" className="flex items-center space-x-3">
          {/* Search Trigger Button */}
          <button
            id="search-trigger-btn"
            onClick={onOpenSearch}
            className="flex items-center space-x-2 rounded-full border border-outline-variant bg-surface px-4 py-1.5 text-xs text-secondary transition-all hover:border-outline hover:text-on-surface md:text-sm"
          >
            <Search size={14} />
            <span className="hidden sm:inline">Search Spots...</span>
            <kbd className="hidden rounded bg-surface-container px-1.5 py-0.5 text-[10px] font-mono md:inline">
              ⌘K
            </kbd>
          </button>

          {/* Minimalist Profile/Avatar */}
          <div id="user-avatar" className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-on-surface text-surface text-xs font-bold font-mono">
            OS
          </div>

          {/* Hamburger button for mobile */}
          <button
            id="mobile-hamburger-btn"
            onClick={() => setIsMenuOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant text-secondary hover:text-on-surface hover:border-outline md:hidden transition-all bg-surface-bright"
            aria-label="Open Menu"
          >
            <Menu size={18} />
          </button>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar (or Navigation Tab Row) */}
      <div id="mobile-nav" className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-outline-variant bg-surface px-2 py-2.5 md:hidden justify-around">
        <button
          id="mobile-nav-explore"
          onClick={() => setActiveTab('explore')}
          className={`flex flex-col items-center space-y-1 text-[10px] font-medium transition-all ${
            activeTab === 'explore' ? 'text-primary' : 'text-secondary'
          }`}
        >
          <Compass size={18} />
          <span>Explore</span>
        </button>

        <button
          id="mobile-nav-map"
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center space-y-1 text-[10px] font-medium transition-all ${
            activeTab === 'map' ? 'text-primary' : 'text-secondary'
          }`}
        >
          <Map size={18} />
          <span>Map</span>
        </button>

        <button
          id="mobile-nav-saved"
          onClick={() => setActiveTab('saved')}
          className={`flex flex-col items-center space-y-1 text-[10px] font-medium transition-all ${
            activeTab === 'saved' ? 'text-primary' : 'text-secondary'
          }`}
        >
          <div className="relative">
            <Heart size={18} className={activeTab === 'saved' ? 'fill-primary text-primary' : ''} />
            {savedCount > 0 && (
              <span className="absolute -top-1.5 -right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-surface animate-bounce">
                {savedCount}
              </span>
            )}
          </div>
          <span>Saved</span>
        </button>

        <button
          id="mobile-nav-post"
          onClick={() => setActiveTab('post')}
          className={`flex flex-col items-center space-y-1 text-[10px] font-medium transition-all ${
            activeTab === 'post' ? 'text-primary' : 'text-secondary'
          }`}
        >
          <PlusCircle size={18} />
          <span>Post Spot</span>
        </button>
      </div>

      {/* Mobile Right-Side Hamburger Menu Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <div id="mobile-hamburger-portal" className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop */}
            <motion.div
              id="hamburger-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black"
            />

            {/* Side Drawer */}
            <motion.div
              id="hamburger-drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-72 bg-surface text-on-surface border-l border-outline-variant flex flex-col p-6 shadow-2xl justify-between"
            >
              <div>
                {/* Header Row */}
                <div className="flex items-center justify-between border-b border-outline-variant pb-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <span className="font-display text-lg font-bold tracking-widest text-on-surface uppercase">
                      OPEN SPOT
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  </div>
                  <button
                    id="close-hamburger-btn"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant text-secondary hover:text-on-surface hover:border-outline transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Subtitle / System Info */}
                <span className="block font-mono text-[9px] font-bold tracking-widest text-secondary uppercase mb-4">
                  NAVIGATION DIRECTORY
                </span>

                {/* Nav Links */}
                <nav className="space-y-2">
                  <button
                    id="hamburger-nav-explore"
                    onClick={() => {
                      setActiveTab('explore');
                      setIsMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border text-xs font-semibold uppercase tracking-wider transition-all ${
                      activeTab === 'explore'
                        ? 'bg-primary text-surface border-primary'
                        : 'border-outline-variant/60 bg-surface-container-low hover:border-outline text-secondary hover:text-on-surface'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Compass size={16} />
                      <span>Explore Archive</span>
                    </div>
                  </button>

                  <button
                    id="hamburger-nav-map"
                    onClick={() => {
                      setActiveTab('map');
                      setIsMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border text-xs font-semibold uppercase tracking-wider transition-all ${
                      activeTab === 'map'
                        ? 'bg-primary text-surface border-primary'
                        : 'border-outline-variant/60 bg-surface-container-low hover:border-outline text-secondary hover:text-on-surface'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Map size={16} />
                      <span>Spot Map</span>
                    </div>
                  </button>

                  <button
                    id="hamburger-nav-saved"
                    onClick={() => {
                      setActiveTab('saved');
                      setIsMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border text-xs font-semibold uppercase tracking-wider transition-all ${
                      activeTab === 'saved'
                        ? 'bg-primary text-surface border-primary'
                        : 'border-outline-variant/60 bg-surface-container-low hover:border-outline text-secondary hover:text-on-surface'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Heart size={16} className={activeTab === 'saved' ? 'fill-current' : ''} />
                      <span>Saved Locations</span>
                    </div>
                    {savedCount > 0 && (
                      <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded-full ${
                        activeTab === 'saved' ? 'bg-surface text-primary' : 'bg-primary text-surface'
                      }`}>
                        {savedCount}
                      </span>
                    )}
                  </button>

                  <button
                    id="hamburger-nav-post"
                    onClick={() => {
                      setActiveTab('post');
                      setIsMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border text-xs font-semibold uppercase tracking-wider transition-all ${
                      activeTab === 'post'
                        ? 'bg-primary text-surface border-primary'
                        : 'border-outline-variant/60 bg-surface-container-low hover:border-outline text-secondary hover:text-on-surface'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <PlusCircle size={16} />
                      <span>Register Plot</span>
                    </div>
                  </button>
                </nav>

                {/* Additional Info Section */}
                <div className="mt-8">
                  <span className="block font-mono text-[9px] font-bold tracking-widest text-secondary uppercase mb-3">
                    SYSTEM STATUS
                  </span>
                  <div className="space-y-2 rounded-xl border border-outline-variant/60 bg-surface-container-low p-3.5">
                    <div className="flex items-center justify-between text-[10px] font-mono text-secondary">
                      <span className="uppercase">GRID VERSION</span>
                      <span className="text-on-surface font-semibold">V2.4.0</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-secondary">
                      <span className="uppercase">RADAR SCOPE</span>
                      <span className="text-emerald-500 font-semibold flex items-center">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping mr-1" />
                        ONLINE
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Footer: Profile & Stats */}
              <div className="border-t border-outline-variant pt-4 space-y-4">
                <div className="flex items-center space-x-3 p-1.5 rounded-lg">
                  <div className="h-9 w-9 rounded-full bg-on-surface text-surface text-xs font-bold font-mono flex items-center justify-center shadow-sm">
                    OS
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-[10px] font-mono font-bold uppercase text-secondary">
                      ACTIVE SCOUT
                    </span>
                    <span className="block text-xs font-bold text-on-surface truncate">
                      devopenspot@gmail.com
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[9px] font-mono text-secondary px-1">
                  <span className="hover:text-on-surface cursor-pointer uppercase flex items-center">
                    <Shield size={10} className="mr-1" /> RULES
                  </span>
                  <span className="hover:text-on-surface cursor-pointer uppercase flex items-center">
                    <Info size={10} className="mr-1" /> INTEL
                  </span>
                  <span className="hover:text-on-surface text-on-surface font-semibold uppercase">
                    UTC -07:00
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}
