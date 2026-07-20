"use client";

import { useRouter } from "next/navigation";
import { NavList } from "./NavList";
import { MobileDrawerTrigger } from "@/components/shell/MobileDrawerTrigger";
// import { SignInLink } from "@/components/shell/SignInLink";
import { useSavedSpots } from "@/hooks/useSavedSpots";
import { useUser } from "@/hooks/useUser";
import { MAIN_CONTENT_ID } from "@/lib/constants";
import { BrandLogo } from "../shell/BrandLogo";

export function Header() {
  const router = useRouter();
  const user = useUser();
  const { count: savedCount } = useSavedSpots(user?.id ?? null);

  const handleSelect = (path: string) => {
    router.push(path);
  };

  return (
    <header
      id="app-header"
      className="sticky top-0 z-40 w-full border-b border-outline-variant bg-surface p-4"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <BrandLogo />

        <NavList
          variant="desktop"
          savedCount={savedCount}
          controlsId={MAIN_CONTENT_ID}
          onSelect={handleSelect}
        />

        <div id="header-actions" className="flex items-center space-x-3">
          {/* <SignInLink variant="header" /> */}
          <MobileDrawerTrigger />
        </div>
      </div>
    </header>
  );
}
