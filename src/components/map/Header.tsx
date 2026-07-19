"use client";

import { MobileDrawerTrigger } from "@/components/shell/MobileDrawerTrigger";
import { BrandLogo } from "@/components/shell/BrandLogo";

import { SwitchFilteredNearby } from "@/components/map/SwitchFilteredNearby";

export function Header() {
  return (
    <header
      id="app-header"
      className="sticky top-0 z-40 w-full border-b border-outline-variant bg-surface p-4"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <BrandLogo />

        <SwitchFilteredNearby />
        <div id="header-actions" className="flex items-center space-x-3">
          <MobileDrawerTrigger />
        </div>
      </div>
    </header>
  );
}
