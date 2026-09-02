"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import {
  ArrowUpRight,
  BrainCircuit,
  Cpu,
  FileStack,
  MessageSquare,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ComputeLedgerProvider, useComputeLedgerContext } from "@/components/vault/ComputeLedgerContext";
import ComputeSetupPanel from "@/components/vault/ComputeSetupPanel";
import InsightsWorkspace from "@/components/vault/InsightsWorkspace";
import { CollapsibleGuideRail, type GuideItem } from "@/components/dashboard/CollapsibleGuideRail";
import { useUserFiles } from "@/hooks/useUserFiles";
import { isEvidenceCategory } from "@/lib/evidence";

const GUIDE: GuideItem[] = [
  {
    id: "what",
    icon: Sparkles,
    title: "What are Insights?",
    body: "A cleanup pass on vault files. 0G Compute reads each file, assigns a category, and writes a short summary you can scan before Chat.",
  },
  {
    id: "ledger",
    icon: Wallet,
    title: "Compute ledger",
    body: "Your prepaid account for AI calls. Create it once, deposit OG, then inference fees come out of that balance — not a separate card charge.",
  },
  {
    id: "provider",
    icon: Cpu,
    title: "Fund a model",
    body: "OG on the ledger is not enough alone. You also fund a specific AI provider so that model can run on your files.",
  },
  {
    id: "analyze",
    icon: BrainCircuit,
    title: "Analyze files",
    body: "Select unlabeled files and run Insights. Results store on 0G Storage and update the on-chain category on your vault registry.",
  },
  {
    id: "desk",
    icon: MessageSquare,
    title: "Then Chat / Trade",
    body: "Labeled files are easier to browse. Insights turns stored-only uploads into agent knowledge (category + summary on-chain).",
  },
  {
    id: "auto",
    icon: FileStack,
    title: "Auto-insights",
    body: "Soon: run Insights automatically when new files land, so the registry stays labeled without a manual batch each time.",
    badge: "Soon",
    accent: true,
  },
];

function InsightsBody() {
  const { isConnected, chainId } = useAccount();
  const { files, refetch } = useUserFiles();
  const { readiness } = useComputeLedgerContext();

  useEffect(() => {
    if (isConnected) void refetch({ silent: true });
  }, [isConnected, chainId, refetch]);

  const stats = useMemo(() => {
    const labeled = files.filter(
      (f) =>
        f.category !== "unassigned" ||
        (f.insightsCID && f.insightsCID !== "" && f.insightsCID !== "0x")
    );
    const evidence = files.filter((f) => isEvidenceCategory(f.category));
    const unlabeled = files.filter((f) => f.category === "unassigned");
    return {
      total: files.length,
      labeled: labeled.length,
      evidence: evidence.length,
      unlabeled: unlabeled.length,
    };
  }, [files]);

  const primaryCta =
    stats.labeled > 0 || readiness.canCompute
      ? {
        href: "/dashboard/advisor/chat",
        label: "Continue to Chat",
      }
      : stats.total === 0
        ? {
          href: "/dashboard/vault/my-files",
          label: "Add vault files first",
        }
        : null;

  return (
    <div className="flex flex-col gap-4 pb-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold   sm:text-3xl">
            Organize your vault
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Turn stored files into agent knowledge. Fund your compute ledger, run Insights to categorize and summarize, then Chat and Trade work from what your agent actually understands.
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
                Available to analyze
              </p>
            </div>

            <div className="bento-brand p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white/80">
                  Labeled
                </span>
                <Sparkles className="h-4 w-4 text-white/80" />
              </div>
              <p className="mt-5 text-3xl font-semibold tabular-nums text-white">
                {isConnected ? stats.labeled : "—"}
              </p>
              <p className="mt-1 text-[11px] text-white/75">
                Categories or insight CIDs on-chain
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
                  Compute
                </span>
                <Cpu className="h-4 w-4 text-white/70" />
              </div>
              <p className="relative mt-5 text-2xl font-semibold   text-white">
                {!isConnected
                  ? "—"
                  : readiness.canCompute
                    ? "Ready"
                    : readiness.hasLedger
                      ? "Fund model"
                      : "Setup"}
              </p>
              <p className="relative mt-1 text-[11px] text-white/65">
                {stats.unlabeled > 0
                  ? `${stats.unlabeled} still unlabeled`
                  : readiness.canCompute
                    ? "Ledger + provider funded"
                    : "Finish setup below to analyze"}
              </p>
            </div>
          </div>

          <ComputeSetupPanel />
          <InsightsWorkspace />
        </div>

        <CollapsibleGuideRail items={GUIDE} />
      </div>
    </div>
  );
}

export function InsightsDesk() {
  return (
    <ComputeLedgerProvider>
      <InsightsBody />
    </ComputeLedgerProvider>
  );
}
