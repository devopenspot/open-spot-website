import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface SectionHeaderProps {
  eyebrow?: string;
  eyebrowIcon?: ReactNode;
  title: string;
  titleId?: string;
  description?: string;
  cta?: ReactNode;
  className?: string;
  eyebrowClassName?: string;
}
// TODO: make a litle enhance of this Component, approach in its margins and paddings
export function SectionHeader({
  eyebrow,
  eyebrowIcon,
  title,
  titleId,
  description,
  cta,
  className,
  eyebrowClassName,
}: SectionHeaderProps) {
  return (
    <div className={cn("mb-8 flex items-end justify-between gap-4", className)}>
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <div className="flex items-center space-x-2 mb-2">
            {eyebrowIcon}
            <span
              className={cn(
                "font-mono text-[10px] font-bold tracking-widest uppercase",
                eyebrowClassName,
              )}
            >
              {eyebrow}
            </span>
          </div>
        )}
        <h2
          id={titleId}
          className="font-display text-xl font-bold tracking-tight text-pink-300 uppercase md:text-3xl"
        >
          {title}
        </h2>
        {description && (
          <p className="mt-2 text-xs text-secondary leading-relaxed max-w-xl">
            {description}
          </p>
        )}
      </div>
      {cta && <div className="shrink-0">{cta}</div>}
    </div>
  );
}
