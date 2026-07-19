"use client";

// import { useRouter } from "next/navigation";
// import { NavList } from "./NavList";
import { MobileDrawerTrigger } from "@/components/shell/MobileDrawerTrigger";
import { BrandLogo } from "@/components/shell/BrandLogo";
import { SignInLink } from "@/components/shell/SignInLink";
import { SearchTrigger } from "@/components/shell/SearchTrigger";

// import { useSavedSpots } from "@/hooks/useSavedSpots";
// import { useUser } from "@/hooks/useUser";
// import { MAIN_CONTENT_ID } from "@/lib/constants";
import { useUIStore } from "@/stores/ui-store";

export function Header() {
  //   const router = useRouter();
  //   const user = useUser();
  //   const { count: savedCount } = useSavedSpots(user?.id ?? null);
  const openSearch = useUIStore((s) => s.openSearch);

  //   const handleSelect = (path: string) => {
  //     router.push(path);
  //   };

  return (
    <header
      id="app-header"
      className="sticky top-0 z-40 w-full border-b border-outline-variant bg-surface p-4"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <BrandLogo />

        {/* <NavList
          variant="desktop"
          savedCount={savedCount}
          controlsId={MAIN_CONTENT_ID}
          onSelect={handleSelect}
        /> */}

        <div id="header-actions" className="flex items-center space-x-3">
          <SearchTrigger onClick={openSearch} />
          <SignInLink variant="header" />
          {/* TODO: I need use this component always visible for destop and responsive for mobiles and tablet screens, rename as hamburger instead Mobile (notation name) */}
          <MobileDrawerTrigger />
        </div>
      </div>
    </header>
  );
}
