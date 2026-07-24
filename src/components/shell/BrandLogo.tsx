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
      <div className="flex items-center gap-3">
        <div className="h-px w-8 bg-primary/50" aria-hidden="true" />
        <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-primary/40 uppercase text-nowrap">
          Open Spot
        </span>
      </div>
    </>
  );

  if (isLink) {
    return (
      <Link
        id={size === "md" ? "brand-logo" : undefined}
        href="/"
        aria-label="Open Spot — home"
        className={cn("flex items-center space-x-2 rounded-none-none", className)}
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
        "flex items-center space-x-2 rounded-none-none cursor-pointer",
        className,
      )}
    >
      {content}
    </button>
  );
}
