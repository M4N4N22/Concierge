"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Cpu, Loader2 } from "lucide-react";
import { ModeToggle } from "./ThemeToggle";
import { WalletControls } from "@/components/wallet/WalletControls";
import { getStepByPath } from "@/lib/journey";
import { useComputeQuota } from "@/hooks/useComputeQuota";
import { cn } from "@/lib/utils";

function HeaderQuotaPill() {
  const { quotas, subsidized, loading } = useComputeQuota(true, "chat");

  if (!subsidized) return null;

  const chat = quotas?.chat;
  const feed = quotas?.feed;
  const exhausted =
    (chat != null && chat.remaining <= 0) ||
    (feed != null && feed.remaining <= 0);

  return (
    <Link
      href="/dashboard/knowledge/compute"
      className={cn(
        "hidden h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium tabular-nums md:inline-flex",
        exhausted
          ? "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300"
          : "border-border/60 bg-muted/30 text-foreground"
      )}
      title="Weekly free compute remaining"
    >
      <Cpu className="h-3.5 w-3.5 shrink-0 text-[var(--brand)]" />
      {loading || !chat || !feed ? (
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
      ) : (
        <span>
          {chat.remaining}/{chat.limit} chat · {feed.remaining}/{feed.limit}{" "}
          feeds
          <span className="ml-1 text-muted-foreground">this week</span>
        </span>
      )}
    </Link>
  );
}

export function DashboardHeader() {
  const pathname = usePathname();
  const step = getStepByPath(pathname);
  const isHome = pathname === "/dashboard";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/40 bg-background px-5 md:px-6">
      <div className="min-w-0 text-xs text-muted-foreground">
        {isHome ? (
          <span className="font-medium text-foreground">Home</span>
        ) : step ? (
          <span className="truncate">
            <Link href="/dashboard" className="hover:text-foreground">
              Home
            </Link>
            <span className="mx-1.5 opacity-40">/</span>
            <span className="font-medium text-foreground">{step.shortTitle}</span>
          </span>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <HeaderQuotaPill />
        <ModeToggle />
        <WalletControls />
      </div>
    </header>
  );
}
