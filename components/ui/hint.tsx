"use client";

import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/** Compact ? affordance — explanation on hover, not inline copy. */
export function Hint({
  text,
  className,
  side = "top",
}: {
  text: string;
  className?: string;
  side?: "top" | "bottom";
}) {
  return (
    <span className={cn("group/hint relative inline-flex align-middle", className)}>
      <button
        type="button"
        tabIndex={0}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:outline-none"
        aria-label="More info"
      >
        <HelpCircle className="h-3.5 w-3.5" strokeWidth={1.75} />
      </button>
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 w-56 rounded-md bg-popover px-2.5 py-2 text-left text-[11px] leading-snug text-popover-foreground opacity-0 shadow-lg ring-1 ring-border",
          "transition-opacity duration-100",
          "group-hover/hint:opacity-100 group-focus-within/hint:opacity-100",
          side === "top"
            ? "bottom-full left-1/2 mb-1.5 -translate-x-1/2"
            : "top-full left-1/2 mt-1.5 -translate-x-1/2"
        )}
      >
        {text}
      </span>
    </span>
  );
}

/** Label row with optional hover hint — use instead of paragraph help text. */
export function FieldLabel({
  children,
  hint,
  className,
}: {
  children: React.ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground",
        className
      )}
    >
      <span>{children}</span>
      {hint ? <Hint text={hint} /> : null}
    </div>
  );
}
