"use client";

import Link from "next/link";
import { ArrowUpRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KnowledgePageShell } from "@/components/dashboard/KnowledgePageShell";
import InsightsWorkspace from "@/components/vault/InsightsWorkspace";
import { useComputeLedgerContext } from "@/components/vault/ComputeLedgerContext";
import { KNOWLEDGE_BASE_COPY } from "@/lib/knowledge/knowledgeStats";
import { CollapsibleGuideRail, type GuideItem } from "@/components/dashboard/CollapsibleGuideRail";
import { BrainCircuit, Cpu, FileStack, MessageSquare, Sparkles } from "lucide-react";

const FEED_GUIDE: GuideItem[] = [
  {
    id: "feed",
    icon: BrainCircuit,
    title: "Feed files",
    body: "Select stored vault uploads. 0G Compute reads each file, assigns a category, and writes a summary to storage and your on-chain registry.",
  },
  {
    id: "quota",
    icon: Cpu,
    title: "Weekly feed quota",
    body: "Each analyzed file uses one feed action. Separate from chat — 10 feeds and 10 chats per wallet per week on the free tier.",
  },
  {
    id: "quick-add",
    icon: Sparkles,
    title: "Quick add skips this",
    body: "Structured wallet sync, CSV, and paste packs are agent knowledge immediately — no feed step needed.",
  },
  {
    id: "auto",
    icon: FileStack,
    title: "Auto-read",
    body: "Turn on Auto-read on Upload to feed new files automatically when compute is ready.",
  },
  {
    id: "chat",
    icon: MessageSquare,
    title: "Then Chat",
    body: "Once fed, files become agent knowledge Concierge can cite in Chat and Learning.",
  },
];

function KnowledgeFeedBody() {
  const { readiness } = useComputeLedgerContext();

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18.5rem] xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex flex-col gap-4">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <h1 className="text-2xl font-semibold sm:text-3xl">
              {KNOWLEDGE_BASE_COPY.feedTitle}
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground">
              {KNOWLEDGE_BASE_COPY.feedDetail}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/dashboard/knowledge">Overview</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/dashboard/knowledge/compute">
                Compute
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </header>

        {!readiness.canCompute ? (
          <div className="flex items-start gap-3 rounded-[var(--radius)] border border-amber-500/30 bg-amber-500/10 px-4 py-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="flex-1 text-sm">
              <p className="font-medium">Compute not ready</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {readiness.operatorSubsidized
                  ? "The Concierge operator pool needs configuration — check Compute."
                  : "Finish ledger setup and fund a model provider on the Compute page."}
              </p>
              <Button asChild size="sm" variant="outline" className="mt-3 rounded-full">
                <Link href="/dashboard/knowledge/compute">Open Compute</Link>
              </Button>
            </div>
          </div>
        ) : null}

        <InsightsWorkspace />
      </div>

      <CollapsibleGuideRail
        heading="Feed help"
        subheading="From stored file to agent knowledge."
        items={FEED_GUIDE}
      />
    </div>
  );
}

export function KnowledgeFeedWorkspace() {
  return (
    <KnowledgePageShell>
      <KnowledgeFeedBody />
    </KnowledgePageShell>
  );
}
