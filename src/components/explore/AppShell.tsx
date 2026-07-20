"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Header } from "./Header";
import { MobileDrawer } from "@/components/shell/MobileDrawer";
import { SearchOverlay } from "@/components/shell/SearchOverlay";
import { ToastViewport } from "@/components/shell/Toast";
import { useUIStore } from "@/stores/ui-store";
import { useSpotsStore } from "@/stores/spots-store";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { MAIN_CONTENT_ID } from "@/lib/constants";
import { ROUTES } from "@/lib/nav";
import type { Spot } from "@/lib/types";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const toggleSearch = useUIStore((s) => s.toggleSearch);
  const closeSearch = useUIStore((s) => s.closeSearch);
  const isSearchOpen = useUIStore((s) => s.isSearchOpen);
  const spots = useSpotsStore((s) => s.spots);
  const pathname = usePathname();

  // The admin segment renders its own shell (`src/app/admin/layout.tsx`).
  // The map segment renders its own shell (`src/app/map/layout.tsx`).
  // Bail out early so the public header, search overlay, and mobile
  // drawer are not double-rendered alongside the admin or map chrome.
  const isAdminRoute = pathname?.startsWith("/admin") ?? false;
  const isMapRoute = pathname === "/map";

  // Close the search overlay on route change
  useEffect(() => {
    if (isSearchOpen) closeSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Only bind the global Cmd/Ctrl+K search shortcut on public routes.
  useKeyboardShortcuts(
    isAdminRoute || isMapRoute
      ? []
      : [
          {
            key: "k",
            cmdOrCtrl: true,
            handler: (e) => {
              e.preventDefault();
              toggleSearch();
            },
          },
        ],
  );

  if (isAdminRoute || isMapRoute) {
    return <>{children}</>;
  }

  const handleSelectSpot = (spot: Spot) => {
    router.push(ROUTES.spot(spot.id));
  };

  return (
    <div
      id="app-root"
      className="min-h-screen bg-surface font-sans text-on-surface flex flex-col selection:bg-primary selection:text-surface"
    >
      <a href={`#${MAIN_CONTENT_ID}`} className="skip-link">
        Skip to main content
      </a>

      <Header />

      <main
        id={MAIN_CONTENT_ID}
        aria-label="Open Spot content"
        className="flex-1 w-full "
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
