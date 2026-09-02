"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, RefreshCw } from "lucide-react";
import { isAddress, type Address } from "viem";
import { toast } from "sonner";
import { useAccount, useChainId } from "wagmi";
import { Button } from "@/components/ui/button";
import { EcosystemSubnav } from "@/components/ecosystem/EcosystemSubnav";
import {
  TransferAgentCard,
  TransferInfoPanel,
} from "@/components/ecosystem/TransferPanel";
import { getAgentDisplayName } from "@/lib/agentDisplayName";
import { resolveAgentPresentation } from "@/lib/agentProfile";
import { useMarketplace } from "@/hooks/useMarketplace";
import { useAgenticId } from "@/hooks/useAgenticId";
import { useUserFiles } from "@/hooks/useUserFiles";
import { zeroGMainnet, zeroGTestnet } from "@/lib/wagmi/config";

function networkLabel(chainId: number) {
  if (chainId === zeroGMainnet.id) return "0G Mainnet";
  if (chainId === zeroGTestnet.id) return "Galileo";
  return `Chain ${chainId}`;
}

export default function TransferWorkspace() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { loading, transferAgent } = useMarketplace();
  const { agent, hasAgent, refetch } = useAgenticId();
  const { files } = useUserFiles();
  const [recipient, setRecipient] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const agentPresentation = agent
    ? resolveAgentPresentation({
        tokenId: agent.tokenId,
        domain: agent.domain,
        aiSignature: agent.aiSignature,
        files,
        displayName: getAgentDisplayName(chainId, agent.tokenId),
      })
    : null;

  const canTransfer =
    isConnected && hasAgent && agent?.access === "owner";

  const onTransfer = async () => {
    if (!agent) {
      toast.error("No Agentic ID to transfer");
      return;
    }
    if (!isAddress(recipient)) {
      toast.error("Enter a valid recipient address");
      return;
    }
    try {
      const tx = await transferAgent(agent.tokenId, recipient as Address);
      toast.success(`Transferred · ${tx.slice(0, 12)}…`);
      setRecipient("");
      await refetch();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Transfer failed");
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      <EcosystemSubnav />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">Transfer</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Send your Agentic ID directly — free P2P
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isConnected && hasAgent && agentPresentation ? (
            <span className="rounded-full bg-muted/70 px-3 py-1 text-xs font-medium tabular-nums">
              {agentPresentation.title}
            </span>
          ) : null}
          <span className="rounded-full bg-[color-mix(in_srgb,var(--success)_12%,transparent)] px-3 py-1 text-xs font-medium text-[var(--success)]">
            No fee
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5 rounded-full"
            onClick={() => void refresh()}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <TransferInfoPanel
          hasAgent={hasAgent}
          agent={agent}
          networkLabel={isConnected ? networkLabel(chainId) : "Connect wallet"}
          presentation={agentPresentation}
        />

        <aside className="flex flex-col gap-3 lg:sticky lg:top-4">
          <TransferAgentCard
            agent={agent}
            hasAgent={hasAgent}
            isConnected={isConnected}
            loading={loading}
            recipient={recipient}
            onRecipientChange={setRecipient}
            onTransfer={() => void onTransfer()}
            canTransfer={!!canTransfer}
          />

          <div className="rounded-[var(--radius)] px-1 text-center text-[11px] text-muted-foreground">
            <Link
              href="/dashboard/ecosystem/marketplace"
              className="font-medium text-[var(--brand)] hover:underline"
            >
              Marketplace
            </Link>
            {" · "}
            <Link
              href="/dashboard/ecosystem/rent"
              className="font-medium text-[var(--brand)] hover:underline"
            >
              Rent
            </Link>
            {" · "}
            <Link
              href="/dashboard/ecosystem"
              className="font-medium text-[var(--brand)] hover:underline"
            >
              Hub
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
