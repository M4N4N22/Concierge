"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAccount } from "wagmi";
import {
  ArrowLeft,
  ArrowUpRight,
  BrainCircuit,
  Fingerprint,
  GraduationCap,
  Layers,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  matchFileToDomain,
  type AgentDomain,
} from "@/lib/domains";

interface RecommendationData {
  title: string;
  description: string;
  summary: string;
  recommendations: string[];
}

const GUIDE: GuideItem[] = [
  {
    id: "what",
    icon: Sparkles,
    title: "What are recommendations?",
    body: "Actionable tips for one focus lens — finance, travel, or subscriptions — from matching vault files via 0G Compute. Not a separate agent type.",
  },
  {
    id: "domain",
    icon: BrainCircuit,
    title: "Pick a lens",
    body: "Choose from Learning, or switch here — each run uses vault context that matches that focus area.",
  },
  {
    id: "compute",
    icon: Layers,
    title: "0G Compute",
    body: "Inference needs a funded compute ledger and provider (same setup as Insights). Without it, you’ll see a clear error instead of fake tips.",
  },
  {
    id: "learning",
    icon: GraduationCap,
    title: "Back to Learning",
    body: "Focus coverage and sync live on Learning. Return there to refresh vault mapping before regenerating recommendations.",
  },
  {
    id: "mint",
    icon: Fingerprint,
    title: "Agentic ID",
    body: "Recommendations use vault data. Mint one Concierge identity for on-chain ownership — lenses stay off the NFT type.",
  },
];

export default function AgentRecommendations() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const domainParam = searchParams.get("domain");
  const domain = AGENT_DOMAINS.includes(domainParam as AgentDomain)
    ? (domainParam as AgentDomain)
    : null;

  const { isConnected, chainId } = useAccount();
  const { files, refetch } = useUserFiles();
  const { hasAgent, agent } = useAgenticId();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RecommendationData | null>(null);

  useEffect(() => {
    if (isConnected) void refetch({ silent: true });
  }, [isConnected, chainId, refetch]);

  const domainFileCount = useMemo(() => {
    if (!domain) return 0;
    return files.filter((f) => matchFileToDomain(f.category) === domain)
      .length;
  }, [domain, files]);

  const loadRecommendations = useCallback(async () => {
    if (!domain || !isConnected) return;
    setLoading(true);
    try {
      const syncedFiles = await refetch();

      const vaultContext = await Promise.all(
        syncedFiles.map(async (f) => {
          let summary = "";
          if (
            f.insightsCID &&
            f.insightsCID !== "0x" + "0".repeat(64)
          ) {
            try {
              summary = await fetchFileContent(f.insightsCID);
            } catch {
              summary = f.category;
            }
          }
          return {
            category: f.category,
            summary,
            domain: matchFileToDomain(f.category),
          };
        })
      );

      const relevant = vaultContext.filter(
        (f) => f.domain === domain || !f.domain
      );

      const res = await fetch("/api/agentRecommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain,
          vaultContext: relevant.length ? relevant : vaultContext,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load recommendations");

      setData(json);
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message);
      setData({
        ...DOMAIN_META[domain],
        summary: DOMAIN_META[domain].description,
        recommendations: [
          "Add evidence to your vault and run Insights so categories are labeled.",
          "Sync from Learning, then refresh recommendations.",
          "Finish 0G Compute setup (ledger + funded provider) if inference failed.",
        ],
      });
    } finally {
      setLoading(false);
    }
  }, [domain, isConnected, refetch]);

  useEffect(() => {
    if (domain && isConnected) void loadRecommendations();
    else setData(null);
  }, [domain, isConnected, loadRecommendations]);

  const selectDomain = (d: AgentDomain) => {
    router.push(`/dashboard/agent/recommendations?domain=${d}`);
  };

  const primaryCta = domain
    ? { href: "/dashboard/agent/learning", label: "Back to Learning" }
    : hasAgent
      ? { href: "/dashboard/advisor/chat", label: "Continue to Chat" }
      : { href: "/dashboard/agent/learning", label: "Open Learning" };

  const meta = domain ? DOMAIN_META[domain] : null;

  return (
    <div className="flex flex-col gap-4 pb-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="text-[11px] font-semibold    text-[var(--brand)]">
            Agentic ID · Recommendations
          </p>
          <h1 className="text-2xl font-semibold   sm:text-3xl">
            {meta ? meta.title.replace(/ focus$/, "") + " tips" : "Recommendations"}
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            {meta
              ? data?.summary ||
                "0G Compute tips grounded in matching vault evidence."
              : "Pick a focus lens to generate tips from matching vault files."}
          </p>
        </div>
        <Button asChild className="rounded-full px-5" variant="outline">
          <Link href={primaryCta.href}>
            {primaryCta.label}
            {primaryCta.href.includes("learning") ? (
              <ArrowLeft className="h-4 w-4" />
            ) : (
              <ArrowUpRight className="h-4 w-4" />
            )}
          </Link>
        </Button>
      </header>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18.5rem] xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="bento p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Domain
                </span>
                <BrainCircuit className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-5 text-2xl font-semibold  ">
                {!domain ? "—" : meta?.title.replace(/ focus$/, "")}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {domain
                  ? `${domainFileCount} matching vault file${domainFileCount === 1 ? "" : "s"}`
                  : "Select a domain below"}
              </p>
            </div>

            <div className="bento-brand p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white/80">Tips</span>
                <Sparkles className="h-4 w-4 text-white/80" />
              </div>
              <p className="mt-5 text-3xl font-semibold tabular-nums text-white">
                {loading ? "…" : data?.recommendations.length ?? "—"}
              </p>
              <p className="mt-1 text-[11px] text-white/75">
                Generated for this domain
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
              <p className="relative mt-5 text-2xl font-semibold   text-white">
                {!isConnected
                  ? "—"
                  : hasAgent && agent
                    ? `#${agent.tokenId.toString()}`
                    : "None"}
              </p>
              <p className="relative mt-1 text-[11px] text-white/65">
                {files.length} vault file{files.length === 1 ? "" : "s"} total
              </p>
            </div>
          </div>

          {/* Domain picker */}
          <section className="bento overflow-hidden">
            <div className="px-5 py-4">
              <h2 className="text-sm font-semibold  ">Focus lens</h2>
              <p className="text-xs text-muted-foreground">
                Switch lens — regenerates recommendations from matching vault files
              </p>
            </div>
            <div className="flex flex-wrap gap-2 border-t border-border/50 px-5 py-4">
              {AGENT_DOMAINS.map((d) => {
                const active = domain === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => selectDomain(d)}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                      active
                        ? "bg-[var(--brand)] text-white"
                        : "bg-muted/60 text-foreground hover:bg-[color-mix(in_srgb,var(--brand)_12%,transparent)]"
                    )}
                  >
                    {DOMAIN_META[d].title.replace(/ focus$/, "")}
                  </button>
                );
              })}
            </div>
          </section>

          {!isConnected ? (
            <div className="bento px-6 py-12 text-center">
              <Sparkles className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" />
              <p className="text-sm font-medium">Connect wallet for recommendations</p>
            </div>
          ) : !domain ? (
            <div className="bento px-6 py-12 text-center">
              <BrainCircuit className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" />
              <p className="text-sm font-medium">Select a domain</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Or open one from{" "}
                <Link
                  href="/dashboard/agent/learning"
                  className="text-[var(--brand)] underline-offset-2 hover:underline"
                >
                  Learning
                </Link>
              </p>
            </div>
          ) : (
            <section className="bento overflow-hidden">
              <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold  ">
                    {meta?.title} recommendations
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Grounded in vault context · 0G Compute
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 shrink-0"
                  onClick={() => void loadRecommendations()}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Refresh
                </Button>
              </div>

              <div className="border-t border-border/50 px-5 py-4">
                {loading && !data ? (
                  <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Generating recommendations…</span>
                  </div>
                ) : data ? (
                  <div className="space-y-2">
                    {data.recommendations.map((rec, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 rounded-2xl bg-muted/45 p-4"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface)] text-[var(--brand)]">
                          <Sparkles className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold     text-muted-foreground">
                            Insight #{i + 1}
                          </p>
                          <p className="mt-1 text-sm leading-relaxed">{rec}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </section>
          )}
        </div>

        <CollapsibleGuideRail items={GUIDE} />
      </div>
    </div>
  );
}
