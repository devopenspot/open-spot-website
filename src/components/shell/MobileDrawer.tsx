"use client";

import { useRouter } from "next/navigation";
import { X, Shield, Info } from "lucide-react";
import { Overlay } from "@/components/feedback/Overlay";
import { UserAvatar } from "@/components/ui";
import { NavList } from "@/components/main/NavList";
import { SignInLink } from "@/components/shell/SignInLink";
import { SignOutButton } from "@/components/shell/SignOutButton";
import { useUIStore } from "@/stores/ui-store";
import { useSavedSpots } from "@/hooks/useSavedSpots";
import { useUser } from "@/hooks/useUser";
import { APP_VERSION, BUILD_TZ } from "@/lib/system-info";
import { BrandLogo } from "@/components/main/BrandLogo";

const DRAWER_ID = "mobile-hamburger-portal";
const DRAWER_TITLE_ID = "mobile-drawer-title";

export function MobileDrawer() {
  const router = useRouter();
  const isDrawerOpen = useUIStore((s) => s.isDrawerOpen);
  const closeDrawer = useUIStore((s) => s.closeDrawer);
  const user = useUser();
  const { count: savedCount } = useSavedSpots(user?.id ?? null);

  const handleSelect = (path: string) => {
    router.push(path);
    closeDrawer();
  };

  return (
    <Overlay
      isOpen={isDrawerOpen}
      onClose={closeDrawer}
      labelledBy={DRAWER_TITLE_ID}
      contentId={DRAWER_ID}
      flush
      containerClassName="md:max-w-96 max-w-full"
      panelClassName="w-72 h-full bg-surface text-on-surface border-l border-outline-variant flex flex-col p-6 shadow-2xl justify-between ml-auto"
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

        <NavList
          variant="mobile-drawer"
          savedCount={savedCount}
          onSelect={handleSelect}
        />

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
        {user ? (
          <>
            <div className="flex items-center space-x-3 p-1.5 rounded-lg">
              <UserAvatar user={user} size="md" />
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] font-mono font-bold uppercase text-secondary">
                  Signed in
                </span>
                <span className="block text-xs font-bold text-on-surface truncate">
                  {user.email}
                </span>
              </div>
            </div>
            <SignOutButton variant="drawer" />
          </>
        ) : (
          <SignInLink variant="drawer" />
        )}

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
    </Overlay>
  );
}
