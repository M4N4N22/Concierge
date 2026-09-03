"use client";

import { useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ComputeLedgerProvider } from "@/components/vault/ComputeLedgerContext";
import ComputeSetupPanel from "@/components/vault/ComputeSetupPanel";

export type ComputeSetupDialogProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  code?: string;
  detail?: string;
};

/** Full 0G Compute ledger / provider setup in a modal (for Desk, Insights, etc.). */
export function ComputeSetupDialog({
  open,
  onClose,
  title,
  message,
  code,
  detail,
}: ComputeSetupDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/55"
        aria-label="Close compute setup"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="compute-setup-title"
        className="relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-border/60 bg-background shadow-2xl sm:rounded-3xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border/50 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold     text-[var(--brand)]">
              0G Compute
            </p>
            <h2
              id="compute-setup-title"
              className="mt-1 text-lg font-semibold  "
            >
              {title || "Set up compute for agents"}
            </h2>
            {message ? (
              <p className="mt-1 text-sm text-muted-foreground">{message}</p>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">
                Create a ledger, deposit OG, and fund a provider so Ask agents
                can run on 0G Compute.
              </p>
            )}
            {code ? (
              <p className="mt-2 font-mono text-[10px] text-muted-foreground">
                {code}
                {detail ? ` · ${detail.slice(0, 120)}` : ""}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="shrink-0"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="brand-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          <ComputeLedgerProvider>
            <ComputeSetupPanel />
          </ComputeLedgerProvider>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border/50 px-5 py-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/knowledge/compute" onClick={onClose}>
              Open Insights setup
            </Link>
          </Button>
          <Button size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
