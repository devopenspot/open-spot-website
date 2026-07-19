import Link from "next/link";
import { cn } from "@/lib/cn";

interface BrandLogoProps {
  onClick?: () => void;
  size?: "sm" | "md";
  className?: string;
}

export function BrandLogo({ onClick, size = "md", className }: BrandLogoProps) {
  const isLink = !onClick;
  const content = (
    <>
      <span
        className={cn(
          "font-display font-bold tracking-widest text-on-surface uppercase",
        )}
      >
        OS
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "rounded-full bg-primary animate-pulse-dot",
          size === "md" ? "h-2 w-2" : "h-1.5 w-1.5",
        )}
      />
    </>
  );

  if (isLink) {
    return (
      <Link
        id={size === "md" ? "brand-logo" : undefined}
        href="/"
        aria-label="Open Spot — home"
        className={cn("flex items-center space-x-2 rounded-sm", className)}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      id={size === "md" ? "brand-logo" : undefined}
      type="button"
      onClick={onClick}
      aria-label="Open Spot home"
      className={cn(
        "flex items-center space-x-2 rounded-sm cursor-pointer",
        className,
      )}
    >
      {content}
    </button>
  );
}
