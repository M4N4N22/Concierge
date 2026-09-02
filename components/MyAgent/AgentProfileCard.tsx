"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Fingerprint,
  Layers,
  Loader2,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MyAgenticId } from "@/hooks/useAgenticId";
import type { VaultFile } from "@/hooks/useUserFiles";
import {
  getAgentDisplayName,
  setAgentDisplayName,
} from "@/lib/agentDisplayName";
import { resolveAgentPresentation } from "@/lib/agentProfile";
import { truncateHash } from "@/lib/explorer";
import { cn } from "@/lib/utils";

export function AgentProfileCard({
  agent,
  files,
  chainId,
  onRefresh,
  refreshing,
  lastTxHref,
}: {
  agent: MyAgenticId;
  files: VaultFile[];
  chainId: number;
  onRefresh?: () => void;
  refreshing?: boolean;
  lastTxHref?: string | null;
}) {
  const [showTechnical, setShowTechnical] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(getAgentDisplayName(chainId, agent.tokenId));
  }, [chainId, agent.tokenId]);

  const presentation = useMemo(
    () =>
      resolveAgentPresentation({
        tokenId: agent.tokenId,
        domain: agent.domain,
        aiSignature: agent.aiSignature,
        files,
        displayName,
      }),
    [agent, displayName, files]
  );

  const saveName = () => {
    setAgentDisplayName(chainId, agent.tokenId, nameDraft);
    setDisplayName(nameDraft.trim() || null);
    setEditingName(false);
  };

  return (
    <section className="bento overflow-hidden">
      <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--brand)_12%,var(--surface))] text-[var(--brand)]">
            <Fingerprint className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">{presentation.title}</h2>
              <span className="rounded-full bg-muted/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {presentation.specialtyLabel}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {presentation.subtitle}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Agentic ID {presentation.tokenLabel}
              {agent.access === "rental" ? " · Rental access" : " · You own this identity"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {lastTxHref ? (
            <Button asChild size="sm" variant="outline" className="rounded-full">
              <a href={lastTxHref} target="_blank" rel="noreferrer">
                Mint tx
              </a>
            </Button>
          ) : null}
          {onRefresh ? (
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={onRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Refresh"
              )}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border/40 px-5 py-4">
        <StatPill
          icon={Layers}
          label={`${presentation.fileCount} vault file${presentation.fileCount === 1 ? "" : "s"}`}
        />
        <StatPill
          label={`${presentation.indexedFileCount} with insights`}
        />
        <StatPill label={presentation.bindingLabel} />
        {presentation.isLegacyDomain ? (
          <StatPill label="Legacy domain — specialty inferred from vault" muted />
        ) : null}
      </div>

      {agent.access === "owner" ? (
        <div className="border-t border-border/40 px-5 py-4">
          {!editingName ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Display name
                </p>
                <p className="mt-0.5 text-sm">
                  {displayName || "Using default from specialty"}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Saved on this device · specialty is set on-chain at mint
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5 rounded-full"
                onClick={() => {
                  setNameDraft(displayName ?? presentation.title);
                  setEditingName(true);
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit name
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1 space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Display name
                </label>
                <Input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  placeholder="e.g. My Finance Concierge"
                  className="rounded-xl"
                  maxLength={64}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="rounded-full"
                  onClick={saveName}
                >
                  Save
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="rounded-full"
                  onClick={() => setEditingName(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      <div className="border-t border-border/40 px-5 py-3">
        <button
          type="button"
          onClick={() => setShowTechnical((v) => !v)}
          className="flex w-full items-center justify-between gap-2 text-left text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <span>On-chain technical details</span>
          {showTechnical ? (
            <ChevronUp className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0" />
          )}
        </button>

        {showTechnical ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <TechnicalRow label="Token ID" value={agent.tokenId.toString()} />
            <TechnicalRow label="Domain" value={agent.domain || "—"} mono />
            <TechnicalRow
              label="Vault"
              value={truncateHash(agent.vault, 10, 8)}
              mono
            />
            <TechnicalRow
              label="Profile binding"
              value={agent.aiSignature || "—"}
              mono
            />
            <TechnicalRow
              label="Storage URI"
              value={agent.embeddingURI || "Not set"}
              mono
              wide
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function StatPill({
  icon: Icon,
  label,
  muted,
}: {
  icon?: typeof Layers;
  label: string;
  muted?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium",
        muted
          ? "bg-amber-500/10 text-amber-800 dark:text-amber-200"
          : "bg-muted/60 text-muted-foreground"
      )}
    >
      {Icon ? <Icon className="h-3 w-3" /> : null}
      {label}
    </span>
  );
}

function TechnicalRow({
  label,
  value,
  mono,
  wide,
}: {
  label: string;
  value: string;
  mono?: boolean;
  wide?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-muted/45 px-3.5 py-3",
        wide && "sm:col-span-2"
      )}
    >
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 break-all text-sm font-medium",
          mono && "font-mono text-xs"
        )}
      >
        {value}
      </p>
    </div>
  );
}
