"use client";

import Link from "next/link";
import { Clock, Fingerprint } from "lucide-react";
import { useChainId } from "wagmi";
import { Button } from "@/components/ui/button";
import type { MyAgenticId } from "@/hooks/useAgenticId";
import { getAgentDisplayName } from "@/lib/agentDisplayName";
import { resolveAgentPresentation } from "@/lib/agentProfile";
import { cn } from "@/lib/utils";

export function AgentStrip({
  agent,
  hasAgent,
  isConnected,
  listingHint,
}: {
  agent: MyAgenticId | null;
  hasAgent: boolean;
  isConnected: boolean;
  listingHint?: string;
}) {
  const chainId = useChainId();

  if (!isConnected) {
    return (
      <div className="dashboard-card flex items-center justify-between gap-3 px-4 py-3">
        <p className="text-sm text-muted-foreground">
          Connect wallet to manage your Agentic ID
        </p>
      </div>
    );
  }

  if (!hasAgent || !agent) {
    return (
      <div className="dashboard-card flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/60">
            <Fingerprint className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">No Agentic ID</p>
            <p className="text-[11px] text-muted-foreground">
              Mint or buy one to list on the ecosystem
            </p>
          </div>
        </div>
        <Button asChild size="sm" className="rounded-full">
          <Link href="/dashboard/agent/mint">Mint</Link>
        </Button>
      </div>
    );
  }

  const presentation = resolveAgentPresentation({
    tokenId: agent.tokenId,
    domain: agent.domain,
    aiSignature: agent.aiSignature,
    displayName: getAgentDisplayName(chainId, agent.tokenId),
  });

  return (
    <div className="dashboard-card flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--brand)_12%,transparent)] text-[var(--brand)]">
          <Fingerprint className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{presentation.title}</p>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                agent.access === "rental"
                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                  : "bg-[color-mix(in_srgb,var(--brand)_12%,transparent)] text-[var(--brand)]"
              )}
            >
              {agent.access === "rental" ? "Rental" : presentation.specialtyLabel}
            </span>
          </div>
          <p className="truncate text-[11px] text-muted-foreground">
            Agentic {presentation.tokenLabel}
            {listingHint ? ` · ${listingHint}` : ""}
          </p>
        </div>
      </div>
      {agent.access === "rental" && agent.rentalExpiresAt ? (
        <p className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          Until {new Date(agent.rentalExpiresAt * 1000).toLocaleDateString()}
        </p>
      ) : (
        <Button asChild size="sm" variant="outline" className="rounded-full">
          <Link href="/dashboard/agent/mint">Profile</Link>
        </Button>
      )}
    </div>
  );
}
