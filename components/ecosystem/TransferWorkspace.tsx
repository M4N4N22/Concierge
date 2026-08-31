"use client";

import { useState } from "react";
import Link from "next/link";
import { isAddress, type Address } from "viem";
import {
  ArrowLeftRight,
  ArrowUpRight,
  Fingerprint,
  Loader2,
  Store,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CollapsibleGuideRail,
  type GuideItem,
} from "@/components/dashboard/CollapsibleGuideRail";
import { useMarketplace } from "@/hooks/useMarketplace";
import { useAgenticId } from "@/hooks/useAgenticId";
import { truncateHash } from "@/lib/explorer";
import { useAccount, useChainId } from "wagmi";
import { zeroGMainnet, zeroGTestnet } from "@/lib/wagmi/config";

const GUIDE: GuideItem[] = [
  {
    id: "what",
    icon: ArrowLeftRight,
    title: "What is Transfer?",
    body: "Direct P2P send of your Agentic ID. No marketplace escrow — the token moves to another wallet with vault binding and encrypted metadata intact.",
  },
  {
    id: "rules",
    icon: Fingerprint,
    title: "One per wallet",
    body: "This contract allows one Agentic ID per owner. Recipient must not already hold a token, or the transfer will fail.",
  },
  {
    id: "market",
    icon: Store,
    title: "Prefer paid sale?",
    body: "Use Marketplace to list for OG with escrow. Use Rent to share access without giving up ownership.",
  },
];

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

  const primaryCta = hasAgent
    ? { href: "/dashboard/ecosystem/marketplace", label: "Open Marketplace" }
    : { href: "/dashboard/agent/mint", label: "Mint Agentic ID" };

  return (
    <div className="flex flex-col gap-4 pb-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
            Ecosystem · Transfer
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Send your Agentic ID
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            P2P transfer with intelligence intact — profile URI, vault
            reference, and encrypted metadata stay on the token.
          </p>
        </div>
        <Button asChild className="rounded-full px-5" variant="outline">
          <Link href={primaryCta.href}>
            {primaryCta.label}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </header>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18.5rem] xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="bento p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Your token
                </span>
                <Fingerprint className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-5 text-3xl font-semibold tabular-nums">
                {!isConnected
                  ? "—"
                  : hasAgent && agent
                    ? `#${agent.tokenId.toString()}`
                    : "None"}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {hasAgent
                  ? agent?.access === "owner"
                    ? "Owner — can transfer"
                    : "Rental — cannot transfer"
                  : "Mint before transferring"}
              </p>
            </div>

            <div className="bento-brand p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white/80">Domain</span>
                <ArrowLeftRight className="h-4 w-4 text-white/80" />
              </div>
              <p className="mt-5 text-xl font-semibold tracking-tight text-white">
                {!hasAgent || !agent ? "—" : agent.domain || "unset"}
              </p>
              <p className="mt-1 text-[11px] text-white/75">
                Moves with the token
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
                <span className="text-xs font-medium text-white/70">Network</span>
                <Wallet className="h-4 w-4 text-white/70" />
              </div>
              <p className="relative mt-5 text-2xl font-semibold tracking-tight text-white">
                {!isConnected ? "—" : networkLabel(chainId)}
              </p>
              <p className="relative mt-1 text-[11px] text-white/65">
                Same chain as mint
              </p>
            </div>
          </div>

          {!isConnected ? (
            <div className="bento px-6 py-12 text-center">
              <ArrowLeftRight className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" />
              <p className="text-sm font-medium">Connect wallet to transfer</p>
            </div>
          ) : !hasAgent || !agent ? (
            <div className="bento px-6 py-10 text-center">
              <Fingerprint className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" />
              <p className="text-sm font-medium">No Agentic ID on this wallet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Mint first, or buy one on the Marketplace
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button asChild size="sm">
                  <Link href="/dashboard/agent/mint">Mint Agentic ID</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href="/dashboard/ecosystem/marketplace">Marketplace</Link>
                </Button>
              </div>
            </div>
          ) : agent.access === "rental" ? (
            <div className="bento px-6 py-10 text-center">
              <p className="text-sm font-medium">Rental access only</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Renters cannot transfer the Agentic ID — ownership required.
              </p>
            </div>
          ) : (
            <section className="bento overflow-hidden">
              <div className="px-5 py-4">
                <h2 className="text-sm font-semibold tracking-tight">
                  Transfer Agentic #{agent.tokenId.toString()}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Recipient must not already hold an Agentic ID
                </p>
              </div>

              <div className="space-y-3 border-t border-border/50 px-5 py-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-2xl bg-muted/45 px-3.5 py-3">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Domain
                    </p>
                    <p className="mt-1 font-mono text-xs font-medium">
                      {agent.domain || "—"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-muted/45 px-3.5 py-3">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Vault
                    </p>
                    <p className="mt-1 font-mono text-xs font-medium">
                      {truncateHash(agent.vault, 10, 8)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-muted/45 px-3.5 py-3 sm:col-span-2">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Profile URI
                    </p>
                    <p className="mt-1 break-all font-mono text-xs font-medium">
                      {agent.embeddingURI || "Not set"}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">
                    Recipient wallet
                  </label>
                  <Input
                    placeholder="0x…"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    disabled={loading}
                    className="font-mono text-sm"
                  />
                </div>

                <Button
                  size="sm"
                  className="gap-2"
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
                  Prefer escrowed sale? Use the{" "}
                  <Link
                    href="/dashboard/ecosystem/marketplace"
                    className="text-[var(--brand)] underline-offset-2 hover:underline"
                  >
                    Marketplace
                  </Link>
                  .
                </p>
              </div>
            </section>
          )}
        </div>

        <CollapsibleGuideRail items={GUIDE} />
      </div>
    </div>
  );
}
