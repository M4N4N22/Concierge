"use client";

import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export function ExplorerLink({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline",
        className
      )}
    >
      {label}
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}
