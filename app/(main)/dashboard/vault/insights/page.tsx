"use client";

import Link from "next/link";
import { ComputeLedgerProvider } from "@/components/vault/ComputeLedgerContext";
import ComputeSetupPanel from "@/components/vault/ComputeSetupPanel";
import InsightsWorkspace from "@/components/vault/InsightsWorkspace";
import { JourneyStepHeader } from "@/components/dashboard/JourneyStepHeader";
import { Button } from "@/components/ui/button";
import { Fingerprint, BrainCircuit } from "lucide-react";

export default function InsightsPage() {
  return (
    <main className="max-w-5xl mx-auto space-y-8">
      <JourneyStepHeader
        step={2}
        journeyId="insights"
        title="AI organizes your vault"
        tagline="0G Compute"
        description="Set up your compute ledger, fund an AI model, then run verifiable inference on your vault files. Categories and summaries are stored on 0G and written back to your on-chain registry."
      />

      {/* How compute works */}
      <section className="rounded-2xl border bg-card overflow-hidden">
        <div className="border-b bg-muted/30 px-5 py-3.5 flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium">How 0G Compute works here</p>
        </div>
        <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border p-5 gap-4 sm:gap-0">
          {[
            {
              title: "Verifiable inference",
              body: "AI runs through 0G Compute providers with on-chain settlement and proof verification.",
            },
            {
              title: "Ledger billing",
              body: "You fund a compute ledger and provider sub-accounts — fees are deducted per inference call.",
            },
            {
              title: "Results on-chain",
              body: "Category + summary CIDs are uploaded to 0G Storage and your vault contract is updated.",
            },
          ].map((item) => (
            <div key={item.title} className="sm:px-4 first:pl-0 last:pr-0">
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <ComputeLedgerProvider>
        <div className="space-y-8">
          <ComputeSetupPanel />
          <InsightsWorkspace />
        </div>
      </ComputeLedgerProvider>

      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-sm">
          <p className="font-medium">Ready for your Agentic ID?</p>
          <p className="text-muted-foreground mt-0.5">
            Once insights are generated, mint an agent trained on your vault data.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/agent/mint" className="gap-2">
            <Fingerprint className="h-4 w-4" />
            Mint Agentic ID
          </Link>
        </Button>
      </div>
    </main>
  );
}
