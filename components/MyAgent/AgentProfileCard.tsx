"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Fingerprint,
  Layers,
  Loader2,
  Pencil,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MyAgenticId } from "@/hooks/useAgenticId";
import type { VaultFile } from "@/hooks/useUserFiles";
import {
  cachePersonalityLocally,
  fetchPersonalityFromUri,
  publishPersonality,
  readCachedPersonality,
} from "@/lib/agentPersonality";
import { resolveAgentPresentation } from "@/lib/agentProfile";
import {
  compareVaultSeal,
  fingerprintVaultEvidence,
  type VaultSealStatus,
} from "@/lib/agenticMint";
import { PRODUCT } from "@/lib/copy/productSpine";
import { useINFTAgent } from "@/hooks/useINFTAgent";
import { truncateHash } from "@/lib/explorer";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAccount } from "wagmi";

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
  const { address } = useAccount();
  const { updateProfile, updateMetadata, getEncryptedMetadata } = useINFTAgent();
  const [showTechnical, setShowTechnical] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sealing, setSealing] = useState(false);
  const [sealStatus, setSealStatus] = useState<VaultSealStatus>("unknown");
  const [onChainSeal, setOnChainSeal] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [bioDraft, setBioDraft] = useState("");
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [bio, setBio] = useState<string | null>(null);

  useEffect(() => {
    const cached = readCachedPersonality(chainId, agent.tokenId);
    setDisplayName(cached.displayName);
    setBio(cached.bio);

    void (async () => {
      const remote = await fetchPersonalityFromUri(agent.embeddingURI);
      if (!remote) return;
      cachePersonalityLocally(chainId, agent.tokenId, remote.name, remote.bio);
      setDisplayName(remote.name || null);
      setBio(remote.bio || null);
    })();
  }, [chainId, agent.tokenId, agent.embeddingURI]);

  const boardOrTradeBound =
    agent.aiSignature.startsWith("guard:") ||
    agent.aiSignature.startsWith("trade:");

  useEffect(() => {
    if (!address || boardOrTradeBound) {
      setSealStatus("unknown");
      setOnChainSeal(null);
      return;
    }
    let cancelled = false;
    const expected = fingerprintVaultEvidence(address, agent.vault, files);
    void (async () => {
      try {
        const raw = await getEncryptedMetadata(agent.tokenId);
        const onChain = typeof raw === "string" ? raw : String(raw);
        if (cancelled) return;
        setOnChainSeal(onChain);
        setSealStatus(compareVaultSeal(onChain, expected));
      } catch {
        if (cancelled) return;
        setOnChainSeal(null);
        setSealStatus("unknown");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recheck when vault roots change
  }, [
    address,
    agent.tokenId,
    agent.vault,
    boardOrTradeBound,
    files.map((f) => f.rootHash).join("|"),
  ]);

  const presentation = useMemo(
    () =>
      resolveAgentPresentation({
        tokenId: agent.tokenId,
        domain: agent.domain,
        aiSignature: agent.aiSignature,
        files,
        displayName,
        bio,
      }),
    [agent, bio, displayName, files]
  );

  const saveIdentity = async () => {
    if (agent.access !== "owner") return;
    setSaving(true);
    try {
      cachePersonalityLocally(chainId, agent.tokenId, nameDraft, bioDraft);
      setDisplayName(nameDraft.trim() || null);
      setBio(bioDraft.trim() || null);

      if (!nameDraft.trim() && !bioDraft.trim()) {
        setEditing(false);
        toast.message("Cleared local name — publish a name to share on marketplace");
        return;
      }

      const published = await publishPersonality({
        name: nameDraft.trim() || "Concierge Agent",
        bio: bioDraft.trim(),
      });
      if (!published) {
        toast.error(
          "Saved on this device — Storage upload failed for on-chain personality"
        );
        setEditing(false);
        return;
      }

      const boardOrTrade =
        agent.aiSignature.startsWith("guard:") ||
        agent.aiSignature.startsWith("trade:");

      if (boardOrTrade) {
        toast.success(
          "Saved on this device. Board/trade bind is active on-chain — remint personality URI after that session if you want marketplace to see it."
        );
        setEditing(false);
        return;
      }

      await updateProfile(agent.tokenId, published.uri, "concierge_v1");
      toast.success("Personality published — marketplace can see your name & bio");
      onRefresh?.();
      setEditing(false);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Could not publish personality"
      );
    } finally {
      setSaving(false);
    }
  };

  const onRefreshSeal = async () => {
    if (agent.access !== "owner" || !address) return;
    if (boardOrTradeBound) {
      toast.message(
        "Board/trade bind is using encrypted metadata — clear that bind before refreshing vault seal"
      );
      return;
    }
    setSealing(true);
    try {
      const seal = fingerprintVaultEvidence(address, agent.vault, files);
      try {
        const raw = await getEncryptedMetadata(agent.tokenId);
        const onChain = typeof raw === "string" ? raw : String(raw);
        if (compareVaultSeal(onChain, seal) === "current") {
          toast.message("Vault seal already matches your current files");
          setSealStatus("current");
          setOnChainSeal(onChain);
          return;
        }
      } catch {
        /* write anyway */
      }
      await updateMetadata(agent.tokenId, seal);
      toast.success("Vault seal refreshed on-chain");
      setSealStatus("current");
      setOnChainSeal(seal);
      onRefresh?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Seal refresh failed");
    } finally {
      setSealing(false);
    }
  };

  const sealLabel =
    sealStatus === "current"
      ? "Seal current"
      : sealStatus === "stale"
        ? "Seal stale"
        : "Seal unknown";

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
                Concierge
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {presentation.subtitle}
            </p>
            {presentation.focusTags.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {presentation.focusTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-muted/70 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                  >
                    {tag} lens
                  </span>
                ))}
              </div>
            ) : null}
            <p className="mt-2 text-xs text-muted-foreground">
              Agentic ID {presentation.tokenLabel}
              {agent.access === "rental"
                ? " · Rental access"
                : " · You own this identity"}
              {" · "}
              Chat learns from the live vault
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
        <StatPill label={`${presentation.indexedFileCount} with insights`} />
        <StatPill label={presentation.bindingLabel} />
        <StatPill
          label={sealLabel}
          tone={
            sealStatus === "stale"
              ? "warn"
              : sealStatus === "current"
                ? "ok"
                : undefined
          }
        />
      </div>

      {agent.access === "owner" ? (
        <div className="border-t border-border/40 px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 max-w-xl">
              <p className="text-xs font-medium text-muted-foreground">
                Vault seal
              </p>
              <p className="mt-0.5 text-sm font-medium">
                {boardOrTradeBound
                  ? "Board/trade bind owns encrypted metadata right now"
                  : sealStatus === "current"
                    ? "On-chain attestation matches your vault"
                    : sealStatus === "stale"
                      ? "Vault grew since last on-chain seal"
                      : "Could not compare seal yet"}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                {boardOrTradeBound
                  ? "Vault seal refresh is paused while a board or trade session is bound. Chat still uses the live vault."
                  : PRODUCT.sealNote}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant={sealStatus === "stale" ? "default" : "outline"}
              className="gap-1.5 rounded-full"
              disabled={sealing || boardOrTradeBound}
              onClick={() => void onRefreshSeal()}
            >
              {sealing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              {sealStatus === "current" ? "Re-seal" : "Refresh seal"}
            </Button>
          </div>
        </div>
      ) : null}

      {agent.access === "owner" ? (
        <div className="border-t border-border/40 px-5 py-4">
          {!editing ? (
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Personality
                </p>
                <p className="mt-0.5 text-sm font-medium">
                  {displayName || "Concierge Agent"}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {bio ||
                    "Name & bio publish to 0G Storage so buyers/renters see your personality — not just a token ID"}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5 rounded-full"
                onClick={() => {
                  setNameDraft(displayName ?? presentation.title);
                  setBioDraft(bio ?? "");
                  setEditing(true);
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Display name
                </label>
                <Input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  placeholder="e.g. Manan's Concierge"
                  className="rounded-xl"
                  maxLength={64}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Short description
                </label>
                <Input
                  value={bioDraft}
                  onChange={(e) => setBioDraft(e.target.value)}
                  placeholder="What this agent helps with"
                  className="rounded-xl"
                  maxLength={240}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="rounded-full"
                  disabled={saving}
                  onClick={() => void saveIdentity()}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Publish"
                  )}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="rounded-full"
                  onClick={() => setEditing(false)}
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
              label="On-chain vault seal"
              value={
                onChainSeal ? truncateHash(onChainSeal, 10, 8) : "Unavailable"
              }
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
  tone,
}: {
  icon?: typeof Layers;
  label: string;
  tone?: "ok" | "warn";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium",
        tone === "ok" &&
          "bg-[color-mix(in_srgb,var(--success)_14%,transparent)] text-[var(--success)]",
        tone === "warn" &&
          "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
        !tone && "bg-muted/60 text-muted-foreground"
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
