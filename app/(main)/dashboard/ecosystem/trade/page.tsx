"use client";

import { useState } from "react";
import Link from "next/link";
import { isAddress, type Address } from "viem";
import { Loader2, ArrowLeftRight } from "lucide-react";
import { JourneyStepHeader } from "@/components/dashboard/JourneyStepHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMarketplace } from "@/hooks/useMarketplace";
import { useAgenticId } from "@/hooks/useAgenticId";
import { toast } from "sonner";

export default function TradePage() {
  const { isConnected, loading, transferAgent } = useMarketplace();
  const { agent, hasAgent, refetch } = useAgenticId();
  const [to, setTo] = useState("");

  const onTransfer = async () => {
    if (!agent) {
      toast.error("No Agentic ID to transfer");
      return;
    }
    if (!isAddress(to)) {
      toast.error("Enter a valid recipient address");
      return;
    }
    try {
      const tx = await transferAgent(agent.tokenId, to as Address);
      toast.success(`Transferred · ${tx.slice(0, 12)}…`);
      setTo("");
      await refetch();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Transfer failed");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <JourneyStepHeader
        step={5}
        journeyId="ecosystem"
        title="Trade Agents"
        tagline="Transfer Agentic IDs with intelligence intact"
        description="Send your Board Chair to another wallet. Profile URI, vault reference, and firewall seals stay on the token. Recipient must not already hold an Agentic ID."
      />

      <section className="rounded-2xl border bg-card p-5 space-y-4">
        {!hasAgent || !agent ? (
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>You don’t have an Agentic ID on this wallet.</p>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/agent/mint">Mint Agentic ID</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="rounded-xl border bg-muted/20 px-4 py-3 text-sm space-y-1">
              <p className="font-semibold">
                Your agent · Token #{agent.tokenId.toString()}
              </p>
              <p className="text-xs text-muted-foreground">
                Domain: {agent.domain || "—"}
              </p>
              <p className="text-xs text-muted-foreground break-all">
                Profile: {agent.embeddingURI || "not bound"}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Recipient wallet</label>
              <Input
                placeholder="0x…"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                disabled={loading}
              />
            </div>

            <Button
              className="gap-2 w-full sm:w-auto"
              disabled={!isConnected || loading || !to}
              onClick={() => void onTransfer()}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowLeftRight className="h-4 w-4" />
              )}
              Transfer Agentic ID
            </Button>

            <p className="text-xs text-muted-foreground">
              Prefer escrowed sale with payment? Use the{" "}
              <Link
                href="/dashboard/ecosystem/marketplace"
                className="text-primary underline"
              >
                Marketplace
              </Link>
              .
            </p>
          </>
        )}
      </section>
    </div>
  );
}
