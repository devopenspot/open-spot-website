"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUIStore } from "@/stores/ui-store";
import { useSpotsStore } from "@/stores/spots-store";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { MobileDrawer } from "@/components/shell/MobileDrawer";
import { SearchOverlay } from "@/components/shell/SearchOverlay";
import { ToastViewport } from "@/components/shell/Toast";
import { Header } from "./Header";
import { MAIN_CONTENT_ID } from "@/lib/constants";
import { ROUTES } from "@/lib/nav";
import type { Spot } from "@/lib/types";

export function MapShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const toggleSearch = useUIStore((s) => s.toggleSearch);
  const closeSearch = useUIStore((s) => s.closeSearch);
  const isSearchOpen = useUIStore((s) => s.isSearchOpen);
  const spots = useSpotsStore((s) => s.spots);
  const pathname = usePathname();

  // Close the search overlay on route change (same behavior as the
  // public shell — search lives across the map chrome too).
  useEffect(() => {
    if (isSearchOpen) closeSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Bind Cmd/Ctrl+K — the public AppShell short-circuits this shortcut
  // on /map, so the map shell owns it.
  useKeyboardShortcuts([
    {
      key: "k",
      cmdOrCtrl: true,
      handler: (e) => {
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
      className="relative flex h-dvh flex-col bg-surface font-sans text-on-surface selection:bg-primary selection:text-surface"
    >
      <a href={`#${MAIN_CONTENT_ID}`} className="skip-link">
        Skip to main content
      </a>

      <Header />

      <main
        id={MAIN_CONTENT_ID}
        aria-label="Spot map"
        className="relative flex-1 overflow-hidden"
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
