"use client";

import Link from "next/link";
import { Compass, Shield } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { Eyebrow } from "@/components/ui";
import { cn } from "@/lib/cn";

export function PostClosedNotice() {
  const user = useUser();
  const adminHref = user?.isAdmin === true ? "/admin/spots/new" : "/admin";

  return (
    <section
      id="post-closed-notice"
      role="status"
      aria-labelledby="post-closed-notice-heading"
      className="mx-auto flex max-w-md flex-col items-center gap-5 rounded-none-none border border-outline-variant bg-surface-container-low p-8 text-center animate-fade-in"
    >
      <div
        aria-hidden="true"
        className="flex h-14 w-14 items-center justify-center rounded-none-none border border-outline-variant bg-surface-container-high text-on-surface"
      >
        <Shield size={24} />
      </div>

      <header className="space-y-2">
        <Eyebrow>Channel closed</Eyebrow>
        <h1
          id="post-closed-notice-heading"
          className="font-display text-2xl font-bold uppercase tracking-tight text-on-surface"
        >
          Public submission paused
        </h1>
        <p className="text-xs leading-relaxed text-secondary">
          Community contributions to the directory are now curated from the
          admin dashboard. Head straight to the new-spot flow, or return to
          the explore archive.
        </p>
      </header>

      <div className="flex w-full flex-col gap-2.5 pt-1">
        <Link
          href={adminHref}
          className={cn(
            "inline-flex w-full items-center justify-center gap-2 rounded-none-none px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition-all shadow-none-none",
            "min-h-10 bg-on-surface text-surface hover:bg-on-surface/90",
          )}
        >
          <Shield size={14} aria-hidden="true" />
          <span>Go to admin dashboard</span>
        </Link>

        <Link
          href="/"
          className={cn(
            "inline-flex w-full items-center justify-center gap-2 rounded-none-none border border-outline px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition-all",
            "min-h-10 text-on-surface hover:bg-surface-container",
          )}
        >
          <Compass size={14} aria-hidden="true" />
          <span>Back to directory</span>
        </Link>
      </div>
    </section>
  );
}
