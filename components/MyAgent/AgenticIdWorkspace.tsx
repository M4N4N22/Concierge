"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAccount, useChainId } from "wagmi";
import {
  ArrowUpRight,
  CandlestickChart,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Fingerprint,
  GraduationCap,
  KeyRound,
  Layers,
  Loader2,
  Lock,
  MessageSquare,
  Shield,
  Store,
  Upload,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CollapsibleGuideRail,
  type GuideItem,
} from "@/components/dashboard/CollapsibleGuideRail";
import { cn } from "@/lib/utils";
import { useINFTAgent } from "@/hooks/useINFTAgent";
import { useAgenticId } from "@/hooks/useAgenticId";
import { useUserFiles } from "@/hooks/useUserFiles";
import { VAULT_ADDRESSES } from "@/lib/addresses";
import { zeroGMainnet, zeroGTestnet } from "@/lib/wagmi/config";
import { buildAgenticMintPayload } from "@/lib/agenticMint";
import { setAgentDisplayName } from "@/lib/agentDisplayName";
import {
  inferSpecialtyFromFiles,
  specialtyToDomain,
  type AgentSpecialty,
} from "@/lib/agentProfile";
import { AGENT_DOMAINS, DOMAIN_META } from "@/lib/domains";
import { getTxExplorerUrl, truncateHash } from "@/lib/explorer";
import { AgentProfileCard } from "@/components/MyAgent/AgentProfileCard";

const GUIDE: GuideItem[] = [
  {
    id: "what",
    icon: Fingerprint,
    title: "What is an Agentic ID?",
    body: "On-chain AI agent identity (formerly INFT). You mint once per wallet — ownership and encrypted metadata travel together when you transfer or list it.",
  },
  {
    id: "mint",
    icon: KeyRound,
    title: "Mint",
    body: "Creates your Agentic ID on 0G Chain, bound to the Concierge vault contract. One mint per wallet on this contract.",
  },
  {
    id: "metadata",
    icon: Lock,
    title: "Encrypted metadata",
    body: "A bytes32 fingerprint derived from your vault evidence roots. It identifies this agent’s intelligence without exposing file contents on-chain.",
  },
  {
    id: "vault",
    icon: Layers,
    title: "Vault binding",
    body: "The token stores your vault contract address so Chat, Learning, and Desk can ground in the same evidence registry.",
  },
  {
    id: "use",
    icon: MessageSquare,
    title: "Chat & Desk",
    body: "After minting, open Chat to ask about vault evidence, or the Trading Desk for agent Buy/Sell/Hold suggestions you still confirm yourself.",
  },
  {
    id: "ecosystem",
    icon: Store,
    title: "Ecosystem",
    body: "List, rent, or transfer your Agentic ID. Transfers keep vault reference and encrypted metadata on the token.",
  },
  {
    id: "standard",
    icon: Shield,
    title: "0G standard",
    body: "Aligned with 0G’s Agentic ID model (ERC-7857 direction): own the agent, not just a pointer. Full oracle re-encryption ships with ecosystem upgrades.",
    badge: "0G",
    accent: true,
  },
];

function networkLabel(chainId: number) {
  if (chainId === zeroGMainnet.id) return "0G Mainnet";
  if (chainId === zeroGTestnet.id) return "Galileo";
  return `Chain ${chainId}`;
}

const SPECIALTY_OPTIONS: AgentSpecialty[] = [...AGENT_DOMAINS, "general"];

function specialtyLabel(specialty: AgentSpecialty): string {
  if (specialty === "general") return "General Concierge";
  return DOMAIN_META[specialty].title.replace(/ Agent$/, "");
}

function specialtyDescription(specialty: AgentSpecialty): string {
  if (specialty === "general") {
    return "Balanced assistant across all vault evidence.";
  }
  return DOMAIN_META[specialty].description;
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
  const [specialty, setSpecialty] = useState<AgentSpecialty>("general");
  const [displayName, setDisplayName] = useState("");
  const [domain, setDomain] = useState("general.concierge");
  const [embeddingURI, setEmbeddingURI] = useState("");
  const [aiSignature, setAiSignature] = useState("concierge_v1");
  const [encryptedHash, setEncryptedHash] = useState<`0x${string}` | "">("");

  useEffect(() => {
    if (files.length > 0) {
      setSpecialty(inferSpecialtyFromFiles(files));
    }
  }, [files]);

  const autoPayload = useMemo(() => {
    if (!address || !vaultAddress) return null;
    return buildAgenticMintPayload({
      owner: address,
      vault: vaultAddress,
      files,
      specialty,
    });
  }, [address, vaultAddress, files, specialty]);

  useEffect(() => {
    if (!showAdvanced) {
      setDomain(specialtyToDomain(specialty));
    }
  }, [showAdvanced, specialty]);

  useEffect(() => {
    if (!autoPayload) return;
    setDomain(autoPayload.domain);
    setEmbeddingURI(autoPayload.embeddingURI);
    setAiSignature(autoPayload.aiSignature);
    setEncryptedHash(autoPayload.encryptedHash);
  }, [autoPayload]);

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

  const primaryCta = hasAgent
    ? { href: "/dashboard/advisor/chat", label: "Continue to Chat" }
    : files.length === 0 && isConnected
      ? { href: "/dashboard/vault/my-files", label: "Add evidence first" }
      : null;

  const handleMint = async () => {
    if (!vaultAddress || !encryptedHash || !address) {
      toast.error("Connect wallet on a 0G chain with vault configured");
      return;
    }
    setMinting(true);
    try {
      const tx = await mintAgent({
        vault: vaultAddress,
        encryptedHash,
        domain: domain.trim() || specialtyToDomain(specialty),
        embeddingURI:
          embeddingURI.trim() || `0g://concierge/${address.toLowerCase()}`,
        aiSignature: aiSignature.trim() || "concierge_v1",
      });
      setLastTx(tx);
      const next = await refetch();
      if (next && displayName.trim()) {
        setAgentDisplayName(chainId, next.tokenId, displayName.trim());
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
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="text-[11px] font-semibold    text-[var(--brand)]">
            Agentic ID
          </p>
          <h1 className="text-2xl font-semibold   sm:text-3xl">
            {hasAgent ? "Your agent identity" : "Mint your Agentic ID"}
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            {hasAgent
              ? "On-chain ownership of your Concierge agent — vault-bound encrypted metadata on 0G Chain."
              : "Mint once per wallet. Encrypted metadata fingerprints your vault so Chat, Desk, and Ecosystem share one identity."}
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
          {/* Stats */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="bento p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Vault files
                </span>
                <Layers className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-5 text-3xl font-semibold tabular-nums">
                {!isConnected ? "—" : filesLoading ? "…" : files.length}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Evidence used in the mint fingerprint
              </p>
            </div>

            <div className="bento-brand p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white/80">Status</span>
                <Fingerprint className="h-4 w-4 text-white/80" />
              </div>
              <p className="mt-5 text-3xl font-semibold tabular-nums text-white">
                {!isConnected
                  ? "—"
                  : agentLoading
                    ? "…"
                    : hasAgent && agent
                      ? `#${agent.tokenId.toString()}`
                      : "Mint"}
              </p>
              <p className="mt-1 text-[11px] text-white/75">
                {hasAgent
                  ? agent?.access === "rental"
                    ? "Active rental"
                    : "Owned on this wallet"
                  : "One Agentic ID per wallet"}
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
              <p className="relative mt-5 text-2xl font-semibold   text-white">
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
              <p className="text-sm font-medium">Connect wallet to mint</p>
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
                  <h2 className="text-sm font-semibold  ">
                    Continue with Concierge
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Your Agentic ID unlocks the rest of the journey
                  </p>
                </div>
                <div className="grid gap-2 border-t border-border/50 px-5 py-4 sm:grid-cols-2">
                  <ContinueCard
                    href="/dashboard/advisor/chat"
                    icon={MessageSquare}
                    title="Chat"
                    detail="Ask about vault evidence"
                  />
                  <ContinueCard
                    href="/dashboard/agent/learning"
                    icon={GraduationCap}
                    title="Learning"
                    detail="Train domain specialists"
                  />
                  <ContinueCard
                    href="/dashboard/trading/desk"
                    icon={CandlestickChart}
                    title="Trading desk"
                    detail="Suggest · quote · confirm"
                  />
                  <ContinueCard
                    href="/dashboard/ecosystem"
                    icon={Store}
                    title="Ecosystem"
                    detail="List, rent, or transfer"
                  />
                </div>
              </section>
            </>
          ) : (
            <section className="bento overflow-hidden">
              <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold  ">
                    Mint Agentic ID
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Fingerprint is derived from vault evidence · confirm in wallet
                  </p>
                </div>
                <Button
                  size="sm"
                  className="gap-2 shrink-0"
                  disabled={!canMint}
                  onClick={() => void handleMint()}
                >
                  {minting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Fingerprint className="h-4 w-4" />
                  )}
                  {minting ? "Minting…" : "Mint Agentic ID"}
                </Button>
              </div>

              {agentLoading ? (
                <div className="flex items-center justify-center gap-2 border-t border-border/50 px-5 py-12 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Checking Agentic ID…</span>
                </div>
              ) : (
                <div className="space-y-3 border-t border-border/50 px-5 py-4">
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
                        Vault is empty (optional)
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        You can mint now with a wallet fingerprint, or add
                        evidence first for a richer metadata hash.
                      </p>
                      <Button asChild size="sm" variant="outline" className="mt-3">
                        <Link href="/dashboard/vault/my-files" className="gap-1.5">
                          <Upload className="h-3.5 w-3.5" />
                          Open Vault
                        </Link>
                      </Button>
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <ReadyLine
                      done={!!vaultAddress}
                      label="Vault contract"
                      detail={
                        vaultAddress
                          ? truncateHash(vaultAddress, 10, 8)
                          : "Unavailable"
                      }
                    />
                    <ReadyLine
                      done={files.length > 0}
                      label="Evidence fingerprint"
                      detail={
                        filesLoading
                          ? "Loading…"
                          : files.length > 0
                            ? `${files.length} file${files.length === 1 ? "" : "s"} hashed`
                            : "Empty vault · wallet-only fingerprint"
                      }
                    />
                    <ReadyLine
                      done={!!encryptedHash}
                      label="Encrypted metadata hash"
                      detail={
                        encryptedHash
                          ? truncateHash(encryptedHash, 10, 8)
                          : "—"
                      }
                    />
                  </div>

                  {agentError ? (
                    <p className="text-xs text-[var(--danger)]">{agentError}</p>
                  ) : null}

                  <div className="space-y-3 rounded-2xl bg-muted/40 p-4">
                    <div>
                      <p className="text-sm font-medium">What is this agent for?</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Pick a specialty — stored on-chain as your agent domain
                        (e.g. finance.concierge).
                      </p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {SPECIALTY_OPTIONS.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setSpecialty(option)}
                          className={cn(
                            "rounded-2xl border px-3.5 py-3 text-left transition-colors",
                            specialty === option
                              ? "border-[color-mix(in_srgb,var(--brand)_35%,transparent)] bg-[color-mix(in_srgb,var(--brand)_8%,var(--surface))]"
                              : "border-transparent bg-[var(--surface)] hover:bg-muted/50"
                          )}
                        >
                          <p className="text-sm font-semibold">
                            {specialtyLabel(option)}
                          </p>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {specialtyDescription(option)}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Display name (optional)
                    </label>
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={`e.g. My ${specialtyLabel(specialty)}`}
                      className="rounded-xl"
                      maxLength={64}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Shown in your dashboard — saved on this device after mint.
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
                    Advanced mint fields
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
                </div>
              )}
            </section>
          )}
        </div>

        <CollapsibleGuideRail items={GUIDE} />
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
        <p className="mt-0.5 font-mono text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function ContinueCard({
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
      <div className="min-w-0">
        <p className="text-sm font-semibold group-hover:text-[var(--brand)]">
          {title}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
      </div>
    </Link>
  );
}
