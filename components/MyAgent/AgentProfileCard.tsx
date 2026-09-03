"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Fingerprint,
  Layers,
  Loader2,
  Pencil,
  RefreshCw,
  UserRound,
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
import { AGENTIC_ID_COPY } from "@/lib/copy/agenticId";
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

  const isOwner = agent.access === "owner";
  const isRental = agent.access === "rental";

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
    if (!isOwner) return;
    setSaving(true);
    try {
      cachePersonalityLocally(chainId, agent.tokenId, nameDraft, bioDraft);
      setDisplayName(nameDraft.trim() || null);
      setBio(bioDraft.trim() || null);

      if (!nameDraft.trim() && !bioDraft.trim()) {
        setEditing(false);
        toast.message("Cleared local name — add a name to show on marketplace");
        return;
      }

      const published = await publishPersonality({
        name: nameDraft.trim() || "Concierge Agent",
        bio: bioDraft.trim(),
        chainId,
      });
      if (!published) {
        toast.error("Saved on this device — could not publish to Storage");
        setEditing(false);
        return;
      }

      if (boardOrTradeBound) {
        toast.success(
          "Saved locally. Desk or board session is bound on-chain — publish again after that session ends to update marketplace."
        );
        setEditing(false);
        return;
      }

      await updateProfile(agent.tokenId, published.uri, "concierge_v1");
      toast.success("Profile published — visible on marketplace & rentals");
      onRefresh?.();
      setEditing(false);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Could not publish profile"
      );
    } finally {
      setSaving(false);
    }
  };

  const onRefreshSeal = async () => {
    if (!isOwner || !address) return;
    if (boardOrTradeBound) {
      toast.message(AGENTIC_ID_COPY.manage.sealBoardTrade);
      return;
    }
    setSealing(true);
    try {
      const seal = fingerprintVaultEvidence(address, agent.vault, files);
      try {
        const raw = await getEncryptedMetadata(agent.tokenId);
        const onChain = typeof raw === "string" ? raw : String(raw);
        if (compareVaultSeal(onChain, seal) === "current") {
          toast.message(AGENTIC_ID_COPY.manage.sealUpToDate);
          setSealStatus("current");
          setOnChainSeal(onChain);
          return;
        }
      } catch {
        /* write anyway */
      }
      await updateMetadata(agent.tokenId, seal);
      toast.success("Vault fingerprint updated on-chain");
      setSealStatus("current");
      setOnChainSeal(seal);
      onRefresh?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSealing(false);
    }
  };

  const sealHeadline = boardOrTradeBound
    ? AGENTIC_ID_COPY.manage.sealBoardTrade
    : sealStatus === "current"
      ? AGENTIC_ID_COPY.manage.sealCurrent
      : sealStatus === "stale"
        ? AGENTIC_ID_COPY.manage.sealStale
        : AGENTIC_ID_COPY.manage.sealUnknown;

  const sealPillLabel =
    sealStatus === "current"
      ? "Fingerprint current"
      : sealStatus === "stale"
        ? "Needs update"
        : "Fingerprint";

  return (
    <div className="flex flex-col gap-4">
      {isRental ? (
        <div className="flex items-start gap-3 rounded-[var(--radius)] border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="text-sm">
            <p className="font-medium">{AGENTIC_ID_COPY.manage.rentalBannerTitle}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {AGENTIC_ID_COPY.manage.rentalBannerBody}
            </p>
          </div>
        </div>
      ) : null}

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
                  {presentation.tokenLabel}
                </span>
                {isRental ? (
                  <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                    Rental
                  </span>
                ) : null}
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
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            {lastTxHref ? (
              <Button asChild size="sm" variant="outline" className="rounded-full">
                <a href={lastTxHref} target="_blank" rel="noreferrer">
                  View mint tx
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
            label={`${presentation.indexedFileCount} in knowledge base`}
          />
          <StatPill label={presentation.bindingLabel} />
          <StatPill
            label={sealPillLabel}
            tone={
              sealStatus === "stale"
                ? "warn"
                : sealStatus === "current"
                  ? "ok"
                  : undefined
            }
          />
        </div>
      </section>

      {isOwner ? (
        <div className="grid gap-4 md:grid-cols-2">
          <ManagePanel
            icon={RefreshCw}
            title={AGENTIC_ID_COPY.manage.sealTitle}
            description={sealHeadline}
            hint={AGENTIC_ID_COPY.manage.sealHint}
            action={
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
                {sealStatus === "current"
                  ? AGENTIC_ID_COPY.manage.sealReseal
                  : AGENTIC_ID_COPY.manage.sealRefresh}
              </Button>
            }
          />

          <ManagePanel
            icon={UserRound}
            title={AGENTIC_ID_COPY.manage.profileTitle}
            description={displayName || "Concierge Agent"}
            hint={bio || AGENTIC_ID_COPY.manage.profileEmptyBio}
            action={
              !editing ? (
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
                  {AGENTIC_ID_COPY.manage.profileEdit}
                </Button>
              ) : null
            }
          >
            {editing ? (
              <div className="mt-3 space-y-3 border-t border-border/40 pt-3">
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
                    placeholder="What this Concierge helps with"
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
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        {AGENTIC_ID_COPY.manage.profileSaving}
                      </>
                    ) : (
                      AGENTIC_ID_COPY.manage.profilePublish
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
            ) : null}
          </ManagePanel>
        </div>
      ) : null}

      <section className="bento overflow-hidden">
        <div className="border-t border-border/40 px-5 py-3">
          <button
            type="button"
            onClick={() => setShowTechnical((v) => !v)}
            className="flex w-full items-center justify-between gap-2 text-left text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <span>On-chain details</span>
            {showTechnical ? (
              <ChevronUp className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0" />
            )}
          </button>

          {showTechnical ? (
            <div className="mt-3 grid gap-2 pb-3 sm:grid-cols-2">
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
                label="On-chain fingerprint"
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
    </div>
  );
}

function ManagePanel({
  icon: Icon,
  title,
  description,
  hint,
  action,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  hint: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="bento flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-[var(--brand)]">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <p className="mt-0.5 text-sm font-medium">{description}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              {hint}
            </p>
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
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
