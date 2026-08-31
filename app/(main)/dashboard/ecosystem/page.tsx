"use client";

import Link from "next/link";
import { Store, KeyRound, ArrowLeftRight } from "lucide-react";
import { JourneyStepHeader } from "@/components/dashboard/JourneyStepHeader";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { MARKETPLACE_ADDRESSES } from "@/lib/addresses";
import { useChainId } from "wagmi";
import { Hint } from "@/components/ui/hint";

const LINKS = [
  {
    href: "/dashboard/ecosystem/marketplace",
    title: "Marketplace",
    hint: "List or buy Agentic IDs. Pay in OG; NFT transfers with intelligence.",
    icon: Store,
  },
  {
    href: "/dashboard/ecosystem/rent",
    title: "Rent",
    hint: "Time-bound board access. Owner keeps the NFT.",
    icon: KeyRound,
  },
  {
    href: "/dashboard/ecosystem/trade",
    title: "Trade",
    hint: "Direct P2P transfer of your Board Chair.",
    icon: ArrowLeftRight,
  },
] as const;

export default function EcosystemHubPage() {
  const chainId = useChainId();
  const configured = !!(
    MARKETPLACE_ADDRESSES[chainId] || MARKETPLACE_ADDRESSES[16602]
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <JourneyStepHeader
        step={5}
        journeyId="ecosystem"
        title="Ecosystem"
        tagline="Agents"
        description="Marketplace, rentals, and P2P trade for data-backed Agentic IDs."
      />

      {!configured && (
        <p className="text-xs text-muted-foreground">
          Marketplace contract not set — Trade still works. Deploy AgentMarketplace to enable list/buy/rent.
        </p>
      )}

      <div className="grid gap-2 sm:grid-cols-3">
        {LINKS.map((item) => (
          <Panel key={item.href} className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <item.icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
              <span className="text-sm font-medium">{item.title}</span>
              <Hint text={item.hint} />
            </div>
            <Button asChild size="sm" variant="outline" className="w-full">
              <Link href={item.href}>Open</Link>
            </Button>
          </Panel>
        ))}
      </div>
    </div>
  );
}
