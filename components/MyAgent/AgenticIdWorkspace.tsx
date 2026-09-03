"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAccount, useChainId } from "wagmi";
import {
  ArrowUpRight,
  BrainCircuit,
  CandlestickChart,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Fingerprint,
  KeyRound,
  Layers,
  Loader2,
  Lock,
  MessageSquare,
  Shield,
  Store,
  Upload,
  UserRound,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CollapsibleGuideRail,
  type GuideItem,
} from "@/components/dashboard/CollapsibleGuideRail";
import { AgentSubnav } from "@/components/MyAgent/AgentSubnav";
import { useINFTAgent } from "@/hooks/useINFTAgent";
import { useAgenticId } from "@/hooks/useAgenticId";
import { useUserFiles } from "@/hooks/useUserFiles";
import { VAULT_ADDRESSES } from "@/lib/addresses";
import { zeroGMainnet, zeroGTestnet } from "@/lib/wagmi/config";
import { buildAgenticMintPayload } from "@/lib/agenticMint";
import {
  cachePersonalityLocally,
  publishPersonality,
} from "@/lib/agentPersonality";
import { defaultAgentDomain } from "@/lib/agentProfile";
import { AGENTIC_ID_COPY } from "@/lib/copy/agenticId";
import { getTxExplorerUrl, truncateHash } from "@/lib/explorer";
import { AgentProfileCard } from "@/components/MyAgent/AgentProfileCard";

const GUIDE_ICONS = {
  what: Fingerprint,
  mint: KeyRound,
  seal: Lock,
  vault: Layers,
  profile: UserRound,
  ecosystem: Store,
  standard: Shield,
} as const;

const GUIDE: GuideItem[] = AGENTIC_ID_COPY.guide.map((item) => ({
  id: item.id,
  icon: GUIDE_ICONS[item.id as keyof typeof GUIDE_ICONS] ?? Fingerprint,
  title: item.title,
  body: item.body,
  ...(item.id === "standard"
    ? { badge: "0G" as const, accent: true }
    : {}),
}));

function networkLabel(chainId: number) {
  if (chainId === zeroGMainnet.id) return "0G Mainnet";
  if (chainId === zeroGTestnet.id) return "Galileo";
  return `Chain ${chainId}`;
}

export default function AgenticIdWorkspace() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { mintAgent } = useINFTAgent();
  const {
    agent,
    hasAgent,
    loading: agentLoading,
    error: agentError,
    refetch,
  } = useAgenticId();
  const { files, loading: filesLoading, refetch: refetchFiles } = useUserFiles();

  const vaultAddress =
    (VAULT_ADDRESSES[chainId] as `0x${string}` | undefined) ?? null;

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [minting, setMinting] = useState(false);
  const [lastTx, setLastTx] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [domain, setDomain] = useState(defaultAgentDomain());
  const [embeddingURI, setEmbeddingURI] = useState("");
  const [aiSignature, setAiSignature] = useState("concierge_v1");
  const [encryptedHash, setEncryptedHash] = useState<`0x${string}` | "">("");

  const autoPayload = useMemo(() => {
    if (!address || !vaultAddress) return null;
    return buildAgenticMintPayload({
      owner: address,
      vault: vaultAddress,
      files,
    });
  }, [address, vaultAddress, files]);

  useEffect(() => {
    if (!autoPayload) return;
    if (!showAdvanced) setDomain(autoPayload.domain);
    setEmbeddingURI(autoPayload.embeddingURI);
    setAiSignature(autoPayload.aiSignature);
    setEncryptedHash(autoPayload.encryptedHash);
  }, [autoPayload, showAdvanced]);

  useEffect(() => {
    if (isConnected) void refetchFiles({ silent: true });
  }, [isConnected, chainId, refetchFiles]);

  const canMint =
    isConnected &&
    !!address &&
    !!vaultAddress &&
    !hasAgent &&
    !!encryptedHash &&
    !minting;

  const handleMint = async () => {
    if (!vaultAddress || !encryptedHash || !address) {
      toast.error("Connect wallet on a 0G chain with vault configured");
      return;
    }
    setMinting(true);
    try {
      let personalityUri =
        embeddingURI.trim() || `0g://concierge/${address.toLowerCase()}`;

      if (displayName.trim() || bio.trim()) {
        const published = await publishPersonality({
          name: displayName.trim() || "Concierge Agent",
          bio: bio.trim(),
          chainId,
        });
        if (published) {
          personalityUri = published.uri;
        } else {
          toast.message(
            "Minting without published profile — you can add name & bio after mint"
          );
        }
      }

      const tx = await mintAgent({
        vault: vaultAddress,
        encryptedHash,
        domain: domain.trim() || defaultAgentDomain(),
        embeddingURI: personalityUri,
        aiSignature: aiSignature.trim() || "concierge_v1",
      });
      setLastTx(tx);
      const next = await refetch();
      if (next && (displayName.trim() || bio.trim())) {
        cachePersonalityLocally(
          chainId,
          next.tokenId,
          displayName.trim(),
          bio.trim()
        );
      }
      toast.success("Agentic ID minted on 0G Chain");
    } catch (err) {
      console.error(err);
      const msg =
        err instanceof Error ? err.message : "Mint failed — check wallet";
      toast.error(msg.length > 120 ? "Mint failed — see console" : msg);
    } finally {
      setMinting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-6">
      <AgentSubnav />

      <header className="space-y-1">
        <p className="text-[11px] font-semibold text-[var(--brand)]">
          Agentic ID
        </p>
        <h1 className="text-2xl font-semibold sm:text-3xl">
          {hasAgent
            ? AGENTIC_ID_COPY.pageTitleManage
            : AGENTIC_ID_COPY.pageTitleMint}
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          {hasAgent
            ? AGENTIC_ID_COPY.taglineManage
            : AGENTIC_ID_COPY.taglineMint}
        </p>
      </header>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18.5rem] xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="bento p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {AGENTIC_ID_COPY.stats.vaultFiles}
                </span>
                <Layers className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-5 text-3xl font-semibold tabular-nums">
                {!isConnected ? "—" : filesLoading ? "…" : files.length}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {AGENTIC_ID_COPY.stats.vaultFilesHint}
              </p>
            </div>

            <div className="bento-brand p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white/80">
                  {AGENTIC_ID_COPY.stats.status}
                </span>
                <Fingerprint className="h-4 w-4 text-white/80" />
              </div>
              <p className="mt-5 text-3xl font-semibold tabular-nums text-white">
                {!isConnected
                  ? "—"
                  : agentLoading
                    ? "…"
                    : hasAgent && agent
                      ? `#${agent.tokenId.toString()}`
                      : "—"}
              </p>
              <p className="mt-1 text-[11px] text-white/75">
                {hasAgent
                  ? agent?.access === "rental"
                    ? AGENTIC_ID_COPY.stats.statusRental
                    : AGENTIC_ID_COPY.stats.statusOwned
                  : AGENTIC_ID_COPY.stats.statusOnePerWallet}
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
                <span className="text-xs font-medium text-white/70">
                  {AGENTIC_ID_COPY.stats.network}
                </span>
                <Wallet className="h-4 w-4 text-white/70" />
              </div>
              <p className="relative mt-5 text-2xl font-semibold text-white">
                {!isConnected ? "—" : networkLabel(chainId)}
              </p>
              <p className="relative mt-1 text-[11px] text-white/65">
                {vaultAddress
                  ? `Vault ${truncateHash(vaultAddress, 6, 4)}`
                  : "Switch to 0G mainnet or Galileo"}
              </p>
            </div>
          </div>

          {!isConnected ? (
            <div className="bento px-6 py-12 text-center">
              <Fingerprint className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" />
              <p className="text-sm font-medium">Connect wallet to continue</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Use the header connect button on 0G Mainnet or Galileo
              </p>
            </div>
          ) : hasAgent && agent ? (
            <>
              <AgentProfileCard
                agent={agent}
                files={files}
                chainId={chainId}
                onRefresh={() => void refetch()}
                refreshing={agentLoading}
                lastTxHref={lastTx ? getTxExplorerUrl(chainId, lastTx) : null}
              />

              <section className="bento overflow-hidden">
                <div className="px-5 py-4">
                  <h2 className="text-sm font-semibold">
                    {AGENTIC_ID_COPY.manage.nextStepsTitle}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {AGENTIC_ID_COPY.manage.nextStepsSubtitle}
                  </p>
                </div>
                <div className="grid gap-2 border-t border-border/50 px-5 py-4 sm:grid-cols-2">
                  <NextStepCard
                    href="/dashboard/advisor/chat"
                    icon={MessageSquare}
                    title={AGENTIC_ID_COPY.nextSteps.chat.title}
                    detail={AGENTIC_ID_COPY.nextSteps.chat.detail}
                  />
                  <NextStepCard
                    href="/dashboard/knowledge"
                    icon={BrainCircuit}
                    title={AGENTIC_ID_COPY.nextSteps.knowledge.title}
                    detail={AGENTIC_ID_COPY.nextSteps.knowledge.detail}
                  />
                  <NextStepCard
                    href="/dashboard/ecosystem"
                    icon={Store}
                    title={AGENTIC_ID_COPY.nextSteps.ecosystem.title}
                    detail={AGENTIC_ID_COPY.nextSteps.ecosystem.detail}
                  />
                  <NextStepCard
                    href="/dashboard/trading/desk"
                    icon={CandlestickChart}
                    title={AGENTIC_ID_COPY.nextSteps.desk.title}
                    detail={AGENTIC_ID_COPY.nextSteps.desk.detail}
                  />
                </div>
              </section>
            </>
          ) : (
            <section className="bento overflow-hidden">
              <div className="px-5 py-4">
                <h2 className="text-sm font-semibold">
                  {AGENTIC_ID_COPY.mint.title}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {AGENTIC_ID_COPY.mint.subtitle}
                </p>
              </div>

              {agentLoading ? (
                <div className="flex items-center justify-center gap-2 border-t border-border/50 px-5 py-12 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Checking Agentic ID…</span>
                </div>
              ) : (
                <div className="space-y-4 border-t border-border/50 px-5 py-4">
                  {!vaultAddress ? (
                    <div className="rounded-2xl bg-amber-500/10 px-4 py-3 text-sm">
                      <p className="font-medium">No vault on this chain</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Switch to 0G Mainnet or Galileo in the header.
                      </p>
                    </div>
                  ) : null}

                  {files.length === 0 && vaultAddress ? (
                    <div className="rounded-2xl bg-muted/40 px-4 py-4">
                      <p className="text-sm font-medium">
                        {AGENTIC_ID_COPY.mint.emptyVaultTitle}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {AGENTIC_ID_COPY.mint.emptyVaultBody}
                      </p>
                      <Button asChild size="sm" variant="outline" className="mt-3">
                        <Link href="/dashboard/vault/upload" className="gap-1.5">
                          <Upload className="h-3.5 w-3.5" />
                          {AGENTIC_ID_COPY.mint.emptyVaultCta}
                        </Link>
                      </Button>
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <ReadyLine
                      done={!!vaultAddress}
                      label={AGENTIC_ID_COPY.readiness.vault}
                      detail={
                        vaultAddress
                          ? truncateHash(vaultAddress, 10, 8)
                          : "Unavailable"
                      }
                    />
                    <ReadyLine
                      done={!!encryptedHash}
                      label={AGENTIC_ID_COPY.readiness.fingerprint}
                      detail={
                        filesLoading
                          ? "Loading…"
                          : files.length > 0
                            ? AGENTIC_ID_COPY.readiness.fingerprintFiles(
                                files.length
                              )
                            : AGENTIC_ID_COPY.readiness.fingerprintEmpty
                      }
                    />
                    <ReadyLine
                      done
                      label={AGENTIC_ID_COPY.readiness.personality}
                      detail={AGENTIC_ID_COPY.readiness.personalityOptional}
                    />
                  </div>

                  {agentError ? (
                    <p className="text-xs text-[var(--danger)]">{agentError}</p>
                  ) : null}

                  <div className="space-y-3 rounded-2xl bg-muted/40 p-4">
                    <div>
                      <p className="text-sm font-medium">
                        {AGENTIC_ID_COPY.mint.nameSectionTitle}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {AGENTIC_ID_COPY.mint.nameSectionBody}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        {AGENTIC_ID_COPY.mint.displayNameLabel}
                      </label>
                      <Input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder={AGENTIC_ID_COPY.mint.displayNamePlaceholder}
                        className="rounded-xl"
                        maxLength={64}
                      />
                      <p className="text-[11px] text-muted-foreground">
                        {AGENTIC_ID_COPY.mint.displayNameHint}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        {AGENTIC_ID_COPY.mint.bioLabel}
                      </label>
                      <Input
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder={AGENTIC_ID_COPY.mint.bioPlaceholder}
                        className="rounded-xl"
                        maxLength={240}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {AGENTIC_ID_COPY.mint.domainNote}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAdvanced((v) => !v)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {showAdvanced ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                    {AGENTIC_ID_COPY.mint.advancedToggle}
                  </button>

                  {showAdvanced ? (
                    <div className="space-y-2 rounded-2xl bg-muted/40 p-3">
                      <Input
                        placeholder="Domain"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                      />
                      <Input
                        placeholder="Encrypted hash (0x…)"
                        value={encryptedHash}
                        onChange={(e) =>
                          setEncryptedHash(e.target.value as `0x${string}`)
                        }
                        className="font-mono text-xs"
                      />
                      <Input
                        placeholder="Embedding URI (0g://…)"
                        value={embeddingURI}
                        onChange={(e) => setEmbeddingURI(e.target.value)}
                        className="font-mono text-xs"
                      />
                      <Input
                        placeholder="AI signature"
                        value={aiSignature}
                        onChange={(e) => setAiSignature(e.target.value)}
                      />
                    </div>
                  ) : null}

                  <Button
                    size="lg"
                    className="w-full gap-2 rounded-full sm:w-auto"
                    disabled={!canMint}
                    onClick={() => void handleMint()}
                  >
                    {minting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Fingerprint className="h-4 w-4" />
                    )}
                    {minting
                      ? AGENTIC_ID_COPY.mint.minting
                      : AGENTIC_ID_COPY.mint.mintButton}
                  </Button>
                </div>
              )}
            </section>
          )}
        </div>

        <CollapsibleGuideRail
          heading="Agentic ID help"
          subheading="Mint, profile, and ecosystem."
          items={GUIDE}
        />
      </div>
    </div>
  );
}

function ReadyLine({
  done,
  label,
  detail,
}: {
  done: boolean;
  label: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-muted/45 p-4">
      {done ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--success)]" />
      ) : (
        <div className="mt-0.5 h-4 w-4 shrink-0 rounded-full border border-border" />
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function NextStepCard({
  href,
  icon: Icon,
  title,
  detail,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-2xl bg-muted/45 p-4 transition-colors hover:bg-[color-mix(in_srgb,var(--brand)_10%,var(--surface))]"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface)] text-[var(--brand)]">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold group-hover:text-[var(--brand)]">
          {title}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
      </div>
      <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}
