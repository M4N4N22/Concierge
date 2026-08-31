"use client";

import Link from "next/link";
import { useAccount, useChainId } from "wagmi";
import {
  ArrowLeftRight,
  ArrowUpRight,
  Fingerprint,
  KeyRound,
  Store,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CollapsibleGuideRail,
  type GuideItem,
} from "@/components/dashboard/CollapsibleGuideRail";
import { useAgenticId } from "@/hooks/useAgenticId";
import { MARKETPLACE_ADDRESSES } from "@/lib/addresses";
import { isConfiguredContract } from "@/lib/agentAccess";
import { zeroGMainnet, zeroGTestnet } from "@/lib/wagmi/config";

const GUIDE: GuideItem[] = [
  {
    id: "what",
    icon: Store,
    title: "What is Ecosystem?",
    body: "List, rent, or transfer Agentic IDs (formerly INFTs). Ownership and encrypted metadata stay with the token when it moves.",
  },
  {
    id: "marketplace",
    icon: Store,
    title: "Marketplace",
    body: "Escrowed sale in OG. Buyer pays; the Agentic ID transfers with vault binding and metadata intact.",
  },
  {
    id: "rent",
    icon: KeyRound,
    title: "Rent",
    body: "Time-bound access without giving up ownership. Renters get a lease; you keep the token.",
  },
  {
    id: "transfer",
    icon: ArrowLeftRight,
    title: "Transfer",
    body: "Direct P2P send to another wallet. No marketplace escrow — recipient must not already hold an Agentic ID on this contract.",
  },
  {
    id: "mint",
    icon: Fingerprint,
    title: "Mint first",
    body: "You need an Agentic ID on this wallet to list, rent out, or transfer. Buyers and renters only need a funded wallet.",
  },
];

const LINKS = [
  {
    href: "/dashboard/ecosystem/marketplace",
    title: "Marketplace",
    detail: "List or buy Agentic IDs for OG",
    icon: Store,
  },
  {
    href: "/dashboard/ecosystem/rent",
    title: "Rent",
    detail: "Share timed access · keep ownership",
    icon: KeyRound,
  },
  {
    href: "/dashboard/ecosystem/trade",
    title: "Transfer",
    detail: "P2P send with intelligence intact",
    icon: ArrowLeftRight,
  },
] as const;

function networkLabel(chainId: number) {
  if (chainId === zeroGMainnet.id) return "0G Mainnet";
  if (chainId === zeroGTestnet.id) return "Galileo";
  return `Chain ${chainId}`;
}

export default function EcosystemHub() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { agent, hasAgent } = useAgenticId();
  const marketConfigured = !!isConfiguredContract(
    MARKETPLACE_ADDRESSES,
    chainId
  );

  const primaryCta = hasAgent
    ? { href: "/dashboard/ecosystem/marketplace", label: "Open Marketplace" }
    : isConnected
      ? { href: "/dashboard/agent/mint", label: "Mint Agentic ID" }
      : null;

  return (
    <div className="flex flex-col gap-4 pb-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
            Ecosystem
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            List · rent · transfer
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Move Agentic IDs across wallets — sales, rentals, or direct
            transfer — while vault binding and encrypted metadata stay on the
            token.
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
                  Agentic ID
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
                  ? agent?.access === "rental"
                    ? "Rental access"
                    : "Ready to list or transfer"
                  : "Mint to sell, rent, or send"}
              </p>
            </div>

            <div className="bento-brand p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white/80">
                  Marketplace
                </span>
                <Store className="h-4 w-4 text-white/80" />
              </div>
              <p className="mt-5 text-2xl font-semibold tracking-tight text-white">
                {marketConfigured ? "Live" : "Unset"}
              </p>
              <p className="mt-1 text-[11px] text-white/75">
                {marketConfigured
                  ? "List / buy / rent enabled"
                  : "Transfer still works P2P"}
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
                Same chain as your Agentic ID mint
              </p>
            </div>
          </div>

          {!marketConfigured ? (
            <div className="rounded-[var(--radius)] bg-amber-500/10 px-4 py-3 text-sm">
              <p className="font-medium">Marketplace contract not set</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Deploy AgentMarketplace and set env addresses for list/buy/rent.
                P2P transfer works without it.
              </p>
            </div>
          ) : null}

          <section className="bento overflow-hidden">
            <div className="px-5 py-4">
              <h2 className="text-sm font-semibold tracking-tight">Paths</h2>
              <p className="text-xs text-muted-foreground">
                Choose how you want to move or share an Agentic ID
              </p>
            </div>
            <div className="grid gap-2 border-t border-border/50 px-5 py-4 sm:grid-cols-3">
              {LINKS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex flex-col gap-3 rounded-2xl bg-muted/45 p-4 transition-colors hover:bg-[color-mix(in_srgb,var(--brand)_10%,var(--surface))]"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface)] text-[var(--brand)]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold group-hover:text-[var(--brand)]">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.detail}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>

        <CollapsibleGuideRail items={GUIDE} />
      </div>
    </div>
  );
}
