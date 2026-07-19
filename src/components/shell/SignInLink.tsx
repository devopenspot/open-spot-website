"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/cn";

type Variant = "header" | "drawer";

const BASE_CLASSES =
  "inline-flex items-center justify-center font-mono font-bold uppercase tracking-widest transition-all rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-surface focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

const VARIANT_CLASSES: Record<Variant, string> = {
  header:
    "border border-outline text-on-surface hover:bg-surface-container text-[10px] px-3 py-1.5",
  drawer:
    "w-full mt-1.5 rounded-lg border border-outline bg-on-surface text-surface hover:bg-on-surface/90 text-xs px-4 py-2.5",
};

interface SignInLinkProps {
  variant: Variant;
  className?: string;
}

export function SignInLink({ variant, className }: SignInLinkProps) {
  const user = useUser();
  const pathname = usePathname();
  if (user) return null;
  const search =
    pathname && pathname !== "/login"
      ? `?next=${encodeURIComponent(pathname)}`
      : "";
  return (
    <Link
      id="nav-btn-login"
      href={{ pathname: "/login", search }}
      className={cn(
        "text-nowrap",
        BASE_CLASSES,
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      Sign in
    </Link>
  );
}
