"use client";

import Link from "next/link";
import { ArrowLeftRight, Fingerprint, Loader2, Shield, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MyAgenticId } from "@/hooks/useAgenticId";
import { resolveAgentPresentation } from "@/lib/agentProfile";
import { truncateHash } from "@/lib/explorer";

export function TransferAgentCard({
  agent,
  hasAgent,
  isConnected,
  loading,
  recipient,
  onRecipientChange,
  onTransfer,
  canTransfer,
}: {
  agent: MyAgenticId | null;
  hasAgent: boolean;
  isConnected: boolean;
  loading: boolean;
  recipient: string;
  onRecipientChange: (v: string) => void;
  onTransfer: () => void;
  canTransfer: boolean;
}) {
  const presentation = agent
    ? resolveAgentPresentation({
        tokenId: agent.tokenId,
        domain: agent.domain,
        aiSignature: agent.aiSignature,
      })
    : null;

  return (
    <div className="bento overflow-hidden">
      <div className="border-b border-border/40 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand)]">
          Send
        </p>
        <h2 className="mt-1 text-lg font-semibold">Transfer Agentic ID</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Free P2P — no marketplace fee
        </p>
      </div>

      <div className="space-y-4 p-6">
        {!isConnected ? (
          <p className="text-sm text-muted-foreground">
            Connect your wallet to transfer your Agentic ID.
          </p>
        ) : !hasAgent || !agent ? (
          <>
            <p className="text-sm text-muted-foreground">
              Mint or buy an Agentic ID before you can send it to someone else.
            </p>
            <Button asChild className="w-full rounded-full">
              <Link href="/dashboard/agent/mint">Mint Agentic ID</Link>
            </Button>
          </>
        ) : agent.access === "rental" ? (
          <>
            <p className="text-sm text-muted-foreground">
              You have rental access only — ownership is required to transfer.
            </p>
            <Button asChild variant="outline" className="w-full rounded-full">
              <Link href="/dashboard/advisor/chat">Use in Chat</Link>
            </Button>
          </>
        ) : (
          <>
            <div className="rounded-2xl bg-muted/45 px-4 py-3.5">
              <p className="text-xs font-medium text-muted-foreground">
                Sending
              </p>
              <p className="mt-1 text-base font-semibold">
                {presentation?.title ?? `#${agent.tokenId.toString()}`}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Concierge · Vault {truncateHash(agent.vault, 10, 8)}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Recipient wallet
              </label>
              <Input
                placeholder="0x…"
                value={recipient}
                onChange={(e) => onRecipientChange(e.target.value)}
                disabled={loading}
                className="h-11 rounded-xl font-mono text-base"
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Recipient must not already hold an Agentic ID on this chain.
            </p>

            <Button
              size="lg"
              className="w-full gap-2 rounded-full"
              disabled={!canTransfer || loading || !recipient.trim()}
              onClick={onTransfer}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowLeftRight className="h-4 w-4" />
              )}
              Transfer Agentic ID
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export function TransferInfoPanel({
  hasAgent,
  agent,
  networkLabel,
  presentation,
}: {
  hasAgent: boolean;
  agent: MyAgenticId | null;
  networkLabel: string;
  presentation?: ReturnType<typeof resolveAgentPresentation> | null;
}) {
  const tiles = [
    {
      icon: Shield,
      title: "No fee",
      detail: "Direct on-chain transfer — vault and profile stay on the token.",
    },
    {
      icon: Fingerprint,
      title: "One per wallet",
      detail: "Recipient cannot already hold an Agentic ID on this chain.",
    },
    {
      icon: Store,
      title: "Paid options",
      detail: "Sell on Marketplace or offer timed Rent instead of giving up ownership.",
    },
  ];

  return (
    <section className="bento min-h-[320px] overflow-hidden">
      <div className="border-b border-border/40 px-5 py-4">
        <h2 className="text-sm font-semibold">How transfer works</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {networkLabel}
          {hasAgent && agent && presentation
            ? ` · ${presentation.title}`
            : " · connect wallet to send"}
        </p>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
        {tiles.map((tile) => (
          <article
            key={tile.title}
            className="flex flex-col rounded-[var(--radius)] bg-muted/40 p-4"
          >
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--brand)_12%,var(--surface))] text-[var(--brand)]">
              <tile.icon className="h-4 w-4" />
            </div>
            <p className="text-sm font-semibold">{tile.title}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              {tile.detail}
            </p>
          </article>
        ))}
      </div>

      {hasAgent && agent?.embeddingURI ? (
        <div className="border-t border-border/40 px-5 py-4">
          <p className="text-[11px] font-medium text-muted-foreground">
            {presentation?.bindingLabel ?? "Profile"} on token
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Storage URI hidden — expand technical details on your Agent profile.
          </p>
        </div>
      ) : null}
    </section>
  );
}
