"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import {
  ArrowUpRight,
  Cable,
  FileStack,
  Layers,
  LineChart,
  MessageSquare,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import UploadArea from "@/components/vault/UploadArea";
import FileList from "@/components/vault/FileList";
import { CollapsibleGuideRail, type GuideItem } from "@/components/dashboard/CollapsibleGuideRail";
import { useUserFiles } from "@/hooks/useUserFiles";
import { isEvidenceCategory } from "@/lib/evidence";

const GUIDE: GuideItem[] = [
  {
    id: "vault",
    icon: FileStack,
    title: "What is the vault?",
    body: "Your private on-chain filing cabinet. Files live on 0G Storage; this page lists the hashes your wallet owns so agents can cite them later.",
  },
  {
    id: "wallet",
    icon: Wallet,
    title: "Wallet sync",
    body: "Reads balances and recent transfers from the connected wallet and turns them into a structured evidence pack — no CSV export needed.",
  },
  {
    id: "registry",
    icon: Layers,
    title: "Browse the registry",
    body: "After upload, each item appears below. Open a row to peek at the stored content and copy its storage hash.",
  },
  {
    id: "insights",
    icon: Sparkles,
    title: "Insights",
    body: "Optional cleanup pass: 0G Compute labels messy files and writes short summaries back so packs are easier to pick for a session.",
  },
  {
    id: "desk",
    icon: MessageSquare,
    title: "Talk to your data",
    body: "Where you ask about spend, patterns, and vault evidence — advisory chat, not trading.",
  },
  {
    id: "trade",
    icon: LineChart,
    title: "Trading desk",
    body: "Agents suggest Buy, Sell, or Hold from wallet balances. Apply to the OG/USDC order, quote, and confirm. Strategies live next door.",
  },
  {
    id: "connectors",
    icon: Cable,
    title: "Connectors",
    body: "Soon: link banks, exchanges, and cloud drives so evidence ingests automatically — no manual CSV each time.",
    badge: "Soon",
    accent: true,
  },
];

export function VaultWorkspace() {
  const { isConnected, chainId } = useAccount();
  const { files, loading, refetch } = useUserFiles();
  const [vaultRefresh, setVaultRefresh] = useState(0);

  useEffect(() => {
    if (isConnected) void refetch({ silent: true });
  }, [isConnected, chainId, refetch, vaultRefresh]);

  const onVaultUpdate = useCallback(() => {
    setVaultRefresh((n) => n + 1);
  }, []);

  const stats = useMemo(() => {
    const evidence = files.filter((f) => isEvidenceCategory(f.category));
    const boards = files.filter((f) => f.category === "evidence:board");
    const unassigned = files.filter((f) => f.category === "unassigned");
    return {
      total: files.length,
      evidence: evidence.length,
      boards: boards.length,
      unassigned: unassigned.length,
    };
  }, [files]);

  const primaryCta =
    stats.total > 0
      ? {
          href: "/dashboard/advisor/talk",
          label: "Continue to Talk",
        }
      : null;

  return (
    <div className="flex flex-col gap-4 pb-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
            Vault
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Evidence intake
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Bring wallet history, spreadsheets, or notes into Concierge as clean
            evidence packs Talk and Trade can actually use.
          </p>
        </div>
        {primaryCta ? (
          <Button asChild className="rounded-full px-5">
            <Link href={primaryCta.href}>
              {primaryCta.label}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : null}
      </header>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18.5rem] xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="bento p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Vault files
                </span>
                <FileStack className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-5 text-3xl font-semibold tabular-nums">
                {isConnected ? stats.total : "—"}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Items registered to this wallet
              </p>
            </div>

            <div className="bento-brand p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white/80">
                  Evidence packs
                </span>
                <Layers className="h-4 w-4 text-white/80" />
              </div>
              <p className="mt-5 text-3xl font-semibold tabular-nums text-white">
                {isConnected ? stats.evidence : "—"}
              </p>
              <p className="mt-1 text-[11px] text-white/75">
                Structured facts ready for agents
              </p>
            </div>

            <div className="bento-ink relative overflow-hidden p-5">
              <div
                className="pointer-events-none absolute -right-6 -top-6 h-12 w-12 rounded-full opacity-100 blur-xl"
                style={{
                  background:
                    "radial-gradient(circle, var(--brand) 100%, transparent 100%)",
                }}
              />
              <div className="relative flex items-center justify-between">
                <span className="text-xs font-medium text-white/70">
                  Desk sessions
                </span>
                <MessageSquare className="h-4 w-4 text-white/70" />
              </div>
              <p className="relative mt-5 text-3xl font-semibold tabular-nums text-white">
                {isConnected ? stats.boards : "—"}
              </p>
              <p className="relative mt-1 text-[11px] text-white/65">
                {stats.unassigned > 0
                  ? `${stats.unassigned} unlabeled — Insights can help`
                  : "Sealed advisor transcripts saved here"}
              </p>
            </div>
          </div>

          <section id="intake" className="scroll-mt-4">
            <UploadArea onVaultUpdate={onVaultUpdate} />
          </section>

          <section id="registry" className="bento scroll-mt-4 p-5">
            <div className="mb-4">
              <h2 className="text-sm font-semibold tracking-tight">
                Your uploaded files
              </h2>
              <p className="text-xs text-muted-foreground">
                Click a file to preview what is stored. Search by category or
                hash
                {loading ? " · refreshing…" : ""}.
              </p>
            </div>
            <FileList refreshToken={vaultRefresh} compact />
          </section>
        </div>

        <CollapsibleGuideRail items={GUIDE} />
      </div>
    </div>
  );
}
