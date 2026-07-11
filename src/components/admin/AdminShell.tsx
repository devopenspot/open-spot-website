"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { ToastViewport } from "@/components/feedback/Toast";
import { UserAvatar } from "@/components/ui";
import { useUser } from "@/hooks/useUser";
import { MAIN_CONTENT_ID } from "@/lib/constants";
import { AdminSidebar } from "./AdminSidebar";
import type { ReactNode } from "react";

export function AdminShell({ children }: { children: ReactNode }) {
  const user = useUser();
  return (
    <div
      id="app-root"
      className="flex min-h-screen flex-col bg-surface font-sans text-on-surface"
    >
      <a href={`#${MAIN_CONTENT_ID}`} className="skip-link">
        Skip to main content
      </a>

      <header
        id="app-header"
        className="sticky top-0 z-40 w-full border-b border-outline-variant bg-surface px-4 py-3 md:px-8"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo />
            <span
              aria-hidden="true"
              className="hidden font-mono text-[10px] font-bold uppercase tracking-widest text-secondary sm:inline"
            >
              /
            </span>
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-secondary">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            <UserAvatar user={user} size="sm" />
            <Link
              href="/"
              className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-widest text-secondary transition-colors hover:text-on-surface"
            >
              <ArrowLeft size={12} aria-hidden="true" />
              Directory
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-6 md:gap-8 md:px-8 md:py-8">
        <AdminSidebar />
        <main
          id={MAIN_CONTENT_ID}
          aria-label="Admin content"
          className="min-w-0 flex-1"
        >
          {children}
        </main>
      </div>

      <ToastViewport />
    </div>
  );
}
