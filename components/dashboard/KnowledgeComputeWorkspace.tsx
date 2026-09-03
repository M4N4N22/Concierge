"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KnowledgePageShell } from "@/components/dashboard/KnowledgePageShell";
import ComputeSetupPanel from "@/components/vault/ComputeSetupPanel";
import { KNOWLEDGE_BASE_COPY } from "@/lib/knowledge/knowledgeStats";
import { CollapsibleGuideRail, type GuideItem } from "@/components/dashboard/CollapsibleGuideRail";
import { Cpu, Sparkles, Wallet } from "lucide-react";

const COMPUTE_GUIDE: GuideItem[] = [
  {
    id: "operator",
    icon: Sparkles,
    title: "Concierge compute",
    body: "Early testers use a shared 0G Private Computer pool — connect wallet and feed files without ledger setup.",
  },
  {
    id: "quota",
    icon: Cpu,
    title: "Daily quota",
    body: "Free tier actions per wallet per day. Top up on Private Computer when running low.",
  },
  {
    id: "byo",
    icon: Wallet,
    title: "Advanced: BYO ledger",
    body: "Collapse open for direct 0G Compute ledger — create, deposit OG, and fund model providers yourself.",
  },
];

function KnowledgeComputeBody() {
  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18.5rem] xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex flex-col gap-4">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <h1 className="text-2xl font-semibold sm:text-3xl">
              {KNOWLEDGE_BASE_COPY.computeTitle}
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground">
              {KNOWLEDGE_BASE_COPY.computeDetail}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/dashboard/knowledge">Overview</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/dashboard/knowledge/feed">
                Feed files
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </header>

        <ComputeSetupPanel />
      </div>

      <CollapsibleGuideRail
        heading="Compute help"
        subheading="Operator pool, quota, and BYO ledger."
        items={COMPUTE_GUIDE}
      />
    </div>
  );
}

export function KnowledgeComputeWorkspace() {
  return (
    <KnowledgePageShell>
      <KnowledgeComputeBody />
    </KnowledgePageShell>
  );
}
