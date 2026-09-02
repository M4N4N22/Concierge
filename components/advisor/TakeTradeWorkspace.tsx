"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CandlestickChart,
  ChevronDown,
  Eye,
  Loader2,
  Newspaper,
  RefreshCw,
  Shield,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TradeDesk } from "@/components/trade/TradeDesk";
import {
  CollapsibleGuideRail,
  type GuideItem,
} from "@/components/dashboard/CollapsibleGuideRail";
import { WorkspaceFaq, type FaqItem } from "@/components/dashboard/WorkspaceFaq";
import { cn } from "@/lib/utils";
import { useAgenticId } from "@/hooks/useAgenticId";
import { useAccount } from "wagmi";
import { useTradeBalances } from "@/hooks/useTradeBalances";
import { formatUnits } from "viem";

type NewsItem = {
  id: string;
  title: string;
  source: string;
  url: string;
  published?: string;
};

const LOCAL_NEWS_FALLBACK: NewsItem[] = [
  {
    id: "fb-1",
    title: "Watch liquidity and macro prints before sizing spot risk",
    source: "Concierge context",
    url: "https://www.coindesk.com/",
  },
  {
    id: "fb-2",
    title: "Stablecoin flows and funding rates remain short-term signals",
    source: "Concierge context",
    url: "https://cointelegraph.com/",
  },
  {
    id: "fb-3",
    title: "Never size a swap from headlines alone — use balances + mandate",
    source: "Concierge context",
    url: "https://docs.0g.ai/",
  },
];

const GUIDE: GuideItem[] = [
  {
    id: "flow",
    icon: CandlestickChart,
    title: "Desk flow",
    body: "Agents suggest Buy, Sell, or Hold from wallet balances. You apply the size, fetch an OG/USDC quote, and confirm in your wallet — nothing auto-swaps.",
  },
  {
    id: "agents",
    icon: Sparkles,
    title: "Agent orchestration",
    body: "Analyst, Risk, and Trader run on 0G Compute. Weighted consensus feeds a gatekeeper (auto-eligible, needs confirmation, or blocked) before you act.",
  },
  {
    id: "watcher",
    icon: Eye,
    title: "Portfolio watcher",
    body: "Enable once with a 24h signature. Polls balances every few minutes; on material shifts it previews a heuristic and can re-run agents within cooldown.",
  },
  {
    id: "policy",
    icon: Shield,
    title: "Policy & limits",
    body: "Max notional caps USDC exposure per ticket. Slippage bps guard quotes. Autonomous mode only affects the gate — swaps still need wallet approval.",
  },
  {
    id: "memory",
    icon: Wallet,
    title: "Vault memory",
    body: "Each orchestration saves a trade memory blob to 0G Storage and your vault. Owned Agentic IDs link to the latest decision for audit.",
  },
  {
    id: "news",
    icon: Newspaper,
    title: "News feed",
    body: "Headlines are context only. They never trigger swaps. Size from balances, agent consensus, and your mandate — not headlines.",
  },
];

const FAQ: FaqItem[] = [
  {
    q: "Does the desk trade automatically?",
    a: "No. Agents suggest and the watcher can re-run orchestration, but every swap requires you to review the quote and confirm in your wallet.",
  },
  {
    q: "What pairs can I swap?",
    a: "Live routing is OG/USDC on Uniswap for the connected 0G chain. WETH shows in balances for context but has no live desk route yet.",
  },
  {
    q: "Why do agents fail or show compute errors?",
    a: "You need a funded 0G Compute ledger and an active model provider. Open Compute setup from the error card or fund via Vault → Insights first.",
  },
  {
    q: "What is the gatekeeper?",
    a: "After agent consensus, the gate returns auto-eligible, needs confirmation, or blocked based on firewall rules, mandate limits, and agreement threshold.",
  },
  {
    q: "How does the portfolio watcher work?",
    a: "Sign once for 24 hours. It polls balances and flags shifts (≥$1 USDC or ≥5% OG). Auto mode re-runs agents at most every 15 minutes when auth is valid.",
  },
  {
    q: "Where are trade decisions stored?",
    a: "Orchestration writes JSON memory to 0G Storage and registers it on your vault. Executed swaps also save as trade records.",
  },
];

export function TakeTradeWorkspace() {
  const { isConnected } = useAccount();
  const { agent, hasAgent } = useAgenticId();
  const { rows, loading: balLoading, usdcBalance, usdcDecimals } =
    useTradeBalances();

  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsLive, setNewsLive] = useState(false);
  const [newsNote, setNewsNote] = useState<string | null>(null);
  const [newsOpen, setNewsOpen] = useState(true);

  const loadNews = useCallback(async () => {
    setNewsLoading(true);
    setNewsNote(null);
    try {
      const res = await fetch("/api/marketNews");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items = (data.items as NewsItem[]) ?? [];
      if (items.length === 0) {
        setNews(LOCAL_NEWS_FALLBACK);
        setNewsLive(false);
        setNewsNote("Showing context cards");
      } else {
        setNews(items);
        setNewsLive(!data.fallback);
        setNewsNote(data.note ?? (data.fallback ? "Showing context cards" : null));
      }
    } catch {
      setNews(LOCAL_NEWS_FALLBACK);
      setNewsLive(false);
      setNewsNote("Live feeds offline — showing context cards");
    } finally {
      setNewsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNews();
  }, [loadNews]);

  const ogDisplay = isConnected
    ? rows.find((r) => r.id === "og")?.balance ?? "0"
    : "—";
  const usdcDisplay = isConnected
    ? rows.find((r) => r.id === "usdc")?.balance ?? "0"
    : "—";
  const spendableUsdc = isConnected
    ? Number(formatUnits(usdcBalance, usdcDecimals))
    : 0;

  const primaryCta = !hasAgent
    ? { href: "/dashboard/agent/mint", label: "Mint Agentic ID" }
    : { href: "/dashboard/trading/strategies", label: "Open Strategies" };

  return (
    <div className="flex flex-col gap-4 pb-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="text-[11px] font-semibold    text-[var(--brand)]">
            Trading & Finance
          </p>
          <h1 className="text-2xl font-semibold   sm:text-3xl">
            Desk
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Multi-agent consensus on 0G Compute, gated quotes on OG/USDC, and a
            portfolio watcher — you always confirm swaps in your wallet.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isConnected && hasAgent && agent ? (
            <Link
              href="/dashboard/agent/mint"
              className="rounded-full bg-[color-mix(in_srgb,var(--brand)_12%,transparent)] px-2.5 py-1 text-[11px] font-medium text-[var(--brand)]"
            >
              Agentic #{agent.tokenId.toString()}
            </Link>
          ) : null}
          <Button asChild className="rounded-full px-5">
            <Link href={primaryCta.href}>
              {primaryCta.label}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18.5rem] xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="bento p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  OG / W0G
                </span>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-5 text-3xl font-semibold tabular-nums">
                {balLoading && isConnected ? "…" : ogDisplay}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Spendable on sell side
              </p>
            </div>

            <div className="bento-brand p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white/80">USDC</span>
                <Wallet className="h-4 w-4 text-white/80" />
              </div>
              <p className="mt-5 text-3xl font-semibold tabular-nums text-white">
                {balLoading && isConnected ? "…" : usdcDisplay}
              </p>
              <p className="mt-1 text-[11px] text-white/75">
                {spendableUsdc > 0 ? "Available to buy OG" : "Fund to buy OG"}
              </p>
            </div>

            <div className="bento p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Live route
                </span>
                <CandlestickChart className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-5 text-2xl font-semibold  ">
                OG/USDC
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Uniswap on connected chain
              </p>
            </div>

            <div className="bento-ink relative overflow-hidden p-5 sm:col-span-2 xl:col-span-1">
              <div className="relative flex items-center justify-between">
                <span className="text-xs font-medium text-white/70">
                  Agentic ID
                </span>
                <Sparkles className="h-4 w-4 text-white/70" />
              </div>
              <p className="relative mt-5 text-3xl font-semibold tabular-nums text-white">
                {!isConnected
                  ? "—"
                  : hasAgent && agent
                    ? `#${agent.tokenId.toString()}`
                    : "—"}
              </p>
              <p className="relative mt-1 text-[11px] text-white/65">
                {hasAgent
                  ? "Linked to trade memory"
                  : "Mint to bind decisions"}
              </p>
            </div>
          </div>

          <TradeDesk hideBalanceStats />

          <section className="bento overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border/50 px-5 py-4">
              <button
                type="button"
                onClick={() => setNewsOpen((o) => !o)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left transition-colors hover:opacity-80"
              >
                <Newspaper className="h-4 w-4 shrink-0 text-[var(--brand)]" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Market context</p>
                  <p className="text-[11px] text-muted-foreground">
                    Headlines for awareness — never for sizing
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                    newsOpen && "rotate-180"
                  )}
                />
              </button>
              {newsLive && !newsLoading ? (
                <span className="shrink-0 rounded-full bg-[color-mix(in_srgb,var(--success)_16%,transparent)] px-2 py-0.5 text-[9px] font-semibold     text-[var(--success)]">
                  Live
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => void loadNews()}
                disabled={newsLoading}
                className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted/50 hover:text-foreground disabled:opacity-50"
                aria-label="Refresh news"
              >
                <RefreshCw
                  className={cn("h-3.5 w-3.5", newsLoading && "animate-spin")}
                />
              </button>
            </div>
            {newsOpen ? (
              <div className="px-5 py-4">
                {newsNote ? (
                  <p className="mb-3 rounded-xl bg-muted/45 px-3 py-2 text-[11px] text-muted-foreground">
                    {newsNote}
                  </p>
                ) : null}
                {newsLoading && news.length === 0 ? (
                  <div className="flex items-center gap-2 py-6 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Loading headlines…
                  </div>
                ) : (
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {news.slice(0, 6).map((n) => (
                      <li key={n.id}>
                        <a
                          href={n.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-2xl bg-muted/40 px-3.5 py-3 transition-colors hover:bg-[color-mix(in_srgb,var(--brand)_10%,transparent)]"
                        >
                          <p className="text-xs font-medium leading-snug">
                            {n.title}
                          </p>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {n.source}
                          </p>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </section>

          <WorkspaceFaq
            items={FAQ}
            subtitle="Trading desk, agents, watcher, and execution."
          />
        </div>

        <CollapsibleGuideRail
          heading="How the desk works"
          subheading="Orchestration, limits, and what stays manual."
          items={GUIDE}
        />
      </div>
    </div>
  );
}
