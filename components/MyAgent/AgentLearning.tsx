"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import {
  ArrowUpRight,
  BrainCircuit,
  Fingerprint,
  GraduationCap,
  Layers,
  Loader2,
  RefreshCw,
  Sparkles,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CollapsibleGuideRail,
  type GuideItem,
} from "@/components/dashboard/CollapsibleGuideRail";
import { cn } from "@/lib/utils";
import { useUserFiles } from "@/hooks/useUserFiles";
import { useAgenticId } from "@/hooks/useAgenticId";
import { fetchFileContent } from "@/utils/fetchFileContent";
import {
  AGENT_DOMAINS,
  DOMAIN_META,
  domainProgress,
  matchFileToDomain,
  type AgentDomain,
} from "@/lib/domains";

const GUIDE: GuideItem[] = [
  {
    id: "what",
    icon: GraduationCap,
    title: "What is Learning?",
    body: "Maps vault evidence into domain specialists — finance, travel, subscriptions — so your Agentic ID can focus recommendations.",
  },
  {
    id: "sync",
    icon: RefreshCw,
    title: "Sync vault",
    body: "Pulls on-chain file categories and insight summaries from 0G Storage, then scores how much each domain has learned.",
  },
  {
    id: "progress",
    icon: BrainCircuit,
    title: "Domain progress",
    body: "Progress rises when vault files match that domain’s categories (spend, travel, subscriptions, etc.). Run Insights first for better labels.",
  },
  {
    id: "recs",
    icon: Sparkles,
    title: "Recommendations",
    body: "Open a domain to generate actionable tips with 0G Compute, grounded in the vault context for that specialty.",
  },
  {
    id: "mint",
    icon: Fingerprint,
    title: "Agentic ID",
    body: "Learning works from vault files alone. Mint an Agentic ID so ownership and identity travel with your Concierge agent.",
  },
];

export default function AgentLearning() {
  const router = useRouter();
  const { isConnected, chainId } = useAccount();
  const { files, refetch, loading: filesLoading } = useUserFiles();
  const { hasAgent, agent } = useAgenticId();
  const [loading, setLoading] = useState(false);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (isConnected) void refetch({ silent: true });
  }, [isConnected, chainId, refetch]);

  const stats = useMemo(() => {
    const matched = files.filter((f) => matchFileToDomain(f.category) != null);
    const withInsights = files.filter(
      (f) =>
        f.insightsCID &&
        f.insightsCID !== "" &&
        f.insightsCID !== "0x" + "0".repeat(64)
    );
    return {
      total: files.length,
      matched: matched.length,
      withInsights: withInsights.length,
    };
  }, [files]);

  const handleSyncVault = useCallback(async () => {
    if (!isConnected) {
      toast.error("Connect your wallet first");
      return;
    }
    setLoading(true);
    try {
      const syncedFiles = await refetch();
      for (const file of syncedFiles) {
        if (
          !file.insightsCID ||
          file.insightsCID === "0x" + "0".repeat(64)
        ) {
          continue;
        }
        try {
          await fetchFileContent(file.insightsCID);
        } catch {
          /* category still usable for progress */
        }
      }
      setSynced(true);
      toast.success("Vault synced — domain progress updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to sync vault");
    } finally {
      setLoading(false);
    }
  }, [isConnected, refetch]);

  const primaryCta = hasAgent
    ? { href: "/dashboard/advisor/talk", label: "Continue to Talk" }
    : isConnected
      ? { href: "/dashboard/agent/mint", label: "Mint Agentic ID" }
      : null;

  return (
    <div className="flex flex-col gap-4 pb-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
            Agentic ID · Learning
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Domain learning
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Sync vault evidence, score specialist domains, then open
            recommendations powered by 0G Compute.
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
                  Vault files
                </span>
                <Layers className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-5 text-3xl font-semibold tabular-nums">
                {!isConnected ? "—" : filesLoading ? "…" : stats.total}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Available for domain matching
              </p>
            </div>

            <div className="bento-brand p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white/80">
                  Domain-matched
                </span>
                <BrainCircuit className="h-4 w-4 text-white/80" />
              </div>
              <p className="mt-5 text-3xl font-semibold tabular-nums text-white">
                {!isConnected ? "—" : stats.matched}
              </p>
              <p className="mt-1 text-[11px] text-white/75">
                Files mapped to a specialist
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
                  Agentic ID
                </span>
                <Fingerprint className="h-4 w-4 text-white/70" />
              </div>
              <p className="relative mt-5 text-2xl font-semibold tracking-tight text-white">
                {!isConnected
                  ? "—"
                  : hasAgent && agent
                    ? `#${agent.tokenId.toString()}`
                    : "None"}
              </p>
              <p className="relative mt-1 text-[11px] text-white/65">
                {stats.withInsights > 0
                  ? `${stats.withInsights} with insight CIDs`
                  : synced
                    ? "Synced · run Insights for richer labels"
                    : "Mint optional · vault drives learning"}
              </p>
            </div>
          </div>

          {!isConnected ? (
            <div className="bento px-6 py-12 text-center">
              <GraduationCap className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" />
              <p className="text-sm font-medium">Connect wallet to sync learning</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Domain progress reads vault files on your 0G chain
              </p>
            </div>
          ) : (
            <>
              <section className="bento overflow-hidden">
                <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-sm font-semibold tracking-tight">
                      Sync vault & update learning
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Refresh on-chain registry and insight summaries
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {stats.total === 0 ? (
                      <Button asChild size="sm" variant="outline">
                        <Link href="/dashboard/vault/my-files" className="gap-1.5">
                          <Upload className="h-3.5 w-3.5" />
                          Open Vault
                        </Link>
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={() => void handleSyncVault()}
                      disabled={loading || filesLoading}
                    >
                      {loading || filesLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      {loading ? "Syncing…" : "Sync vault"}
                    </Button>
                  </div>
                </div>
              </section>

              <section className="bento overflow-hidden">
                <div className="px-5 py-4">
                  <h2 className="text-sm font-semibold tracking-tight">
                    Specialist domains
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Progress from categorized vault evidence — open
                    recommendations per domain
                  </p>
                </div>
                <div className="space-y-2 border-t border-border/50 px-5 py-4">
                  {AGENT_DOMAINS.map((domain) => (
                    <DomainRow
                      key={domain}
                      domain={domain}
                      files={files}
                      onOpen={() =>
                        router.push(
                          `/dashboard/agent/recommendations?domain=${domain}`
                        )
                      }
                    />
                  ))}
                </div>
              </section>
            </>
          )}
        </div>

        <CollapsibleGuideRail items={GUIDE} />
      </div>
    </div>
  );
}

function DomainRow({
  domain,
  files,
  onOpen,
}: {
  domain: AgentDomain;
  files: { category: string }[];
  onOpen: () => void;
}) {
  const meta = DOMAIN_META[domain];
  const progress = domainProgress(files, domain);
  const count = files.filter(
    (f) => matchFileToDomain(f.category) === domain
  ).length;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl bg-muted/45 p-4 sm:flex-row sm:items-center sm:justify-between",
        progress > 0 &&
          "bg-[color-mix(in_srgb,var(--brand)_8%,var(--surface))]"
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold">{meta.title}</p>
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {count} file{count === 1 ? "" : "s"}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{meta.description}</p>
        <div className="mt-3 space-y-1.5">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Learning progress</span>
            <span className="tabular-nums">{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      </div>
      <Button size="sm" variant="outline" className="shrink-0" onClick={onOpen}>
        Recommendations
        <ArrowUpRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
