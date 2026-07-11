"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Header } from "./Header";
import { MobileDrawer } from "./MobileDrawer";
import { SearchOverlay } from "@/components/search/SearchOverlay";
import { ToastViewport } from "@/components/feedback/Toast";
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
  // Bail out early so the public header, search overlay, and mobile
  // drawer are not double-rendered alongside the admin chrome.
  const isAdminRoute = pathname?.startsWith("/admin") ?? false;

  // Close the search overlay on route change
  useEffect(() => {
    if (isSearchOpen) closeSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Only bind the global Cmd/Ctrl+K search shortcut on public routes.
  useKeyboardShortcuts(
    isAdminRoute
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

  if (isAdminRoute) {
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
        className="flex-1 mx-auto w-full max-w-7xl p-4 md:px-8"
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
