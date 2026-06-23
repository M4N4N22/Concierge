"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { truncateHash } from "@/lib/explorer";
import { toast } from "sonner";

export function CopyHash({
  hash,
  truncate = true,
  className,
}: {
  hash: string;
  truncate?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await navigator.clipboard.writeText(hash);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 font-mono text-xs text-primary hover:bg-primary/10 transition-colors",
        className
      )}
      title={hash}
    >
      <span>{truncate ? truncateHash(hash) : hash}</span>
      {copied ? (
        <Check className="h-3 w-3 text-green-600 shrink-0" />
      ) : (
        <Copy className="h-3 w-3 shrink-0 opacity-60" />
      )}
    </button>
  );
}
