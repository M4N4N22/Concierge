"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Newspaper,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TradeDesk } from "@/components/trade/TradeDesk";
import { cn } from "@/lib/utils";
import { useAgenticId } from "@/hooks/useAgenticId";
import { useAccount } from "wagmi";

type NewsItem = {
  id: string;
  title: string;
  source: string;
  url: string;
  published?: string;
};

const NEWS_OPEN_KEY = "concierge.trade.newsOpen";

const LOCAL_NEWS_FALLBACK: NewsItem[] = [
  {
    id: "fb-1",
    title: "Markets digest: watch liquidity and macro prints before sizing risk",
    source: "Concierge context",
    url: "https://www.coindesk.com/",
  },
  {
    id: "fb-2",
    title: "Stablecoin flows and funding rates remain key short-term signals",
    source: "Concierge context",
    url: "https://cointelegraph.com/",
  },
  {
    id: "fb-3",
    title:
      "Risk note: never size a swap from headlines alone — use wallet balances + mandate",
    source: "Concierge context",
    url: "https://docs.0g.ai/",
  },
];

export function TakeTradeWorkspace() {
  const { isConnected } = useAccount();
  const { agent, hasAgent } = useAgenticId();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsLive, setNewsLive] = useState(false);
  const [newsNote, setNewsNote] = useState<string | null>(null);
  const [newsOpen, setNewsOpen] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(NEWS_OPEN_KEY);
      if (raw === "0") setNewsOpen(false);
      if (raw === "1") setNewsOpen(true);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleNews = useCallback(() => {
    setNewsOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(NEWS_OPEN_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

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
        if (data.note) setNewsNote(data.note);
        else if (data.fallback) setNewsNote("Showing context cards");
        else setNewsNote(null);
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

  return (
    <div
      className={cn(
        "grid min-h-[calc(100vh-5.5rem)] gap-4 pb-4",
        "xl:grid-cols-[minmax(0,1fr)_auto]"
      )}
    >
      <div className="flex min-w-0 flex-col gap-4">
        <header className="space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
                Trading & Finance
              </p>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Desk
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isConnected && hasAgent && agent ? (
                <Link
                  href="/dashboard/agent/mint"
                  className="rounded-full bg-[color-mix(in_srgb,var(--brand)_12%,transparent)] px-2.5 py-1 text-[11px] font-medium text-[var(--brand)]"
                >
                  Agentic #{agent.tokenId.toString()}
                </Link>
              ) : isConnected ? (
                <Button asChild size="sm" variant="outline" className="rounded-full">
                  <Link href="/dashboard/agent/mint">Mint Agentic ID</Link>
                </Button>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="xl:hidden"
                onClick={toggleNews}
              >
                <Newspaper className="h-4 w-4" />
                News
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/dashboard/trading/strategies">
                  Strategies
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            Agents suggest Buy, Sell, or Hold from your wallet balances. You
            apply the size, quote OG/USDC, and confirm — nothing auto-executes.
          </p>
        </header>

        <div className="bento p-5 sm:p-6">
          <TradeDesk />
        </div>

        <div className={cn("xl:hidden", !newsOpen && "hidden")}>
          <NewsPanel
            news={news}
            newsLoading={newsLoading}
            newsLive={newsLive}
            newsNote={newsNote}
            onRefresh={() => void loadNews()}
            onCollapse={toggleNews}
            fillHeight={false}
          />
        </div>
      </div>

      <aside
        className={cn(
          "hidden xl:flex xl:sticky xl:top-4 xl:h-[calc(100vh-5.5rem)] xl:flex-col",
          newsOpen ? "xl:w-[22rem]" : "xl:w-11"
        )}
      >
        {newsOpen ? (
          <NewsPanel
            news={news}
            newsLoading={newsLoading}
            newsLive={newsLive}
            newsNote={newsNote}
            onRefresh={() => void loadNews()}
            onCollapse={toggleNews}
            fillHeight
          />
        ) : (
          <button
            type="button"
            onClick={toggleNews}
            className="bento flex h-full w-11 flex-col items-center gap-3 py-4 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Open news feed"
            title="Open news feed"
          >
            <PanelRightOpen className="h-4 w-4" />
            <Newspaper className="h-4 w-4 text-[var(--brand)]" />
            <span
              className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ writingMode: "vertical-rl" }}
            >
              News feed
            </span>
            <ChevronLeft className="mt-auto h-4 w-4" />
          </button>
        )}
      </aside>
    </div>
  );
}

function NewsPanel({
  news,
  newsLoading,
  newsLive,
  newsNote,
  onRefresh,
  onCollapse,
  fillHeight,
}: {
  news: NewsItem[];
  newsLoading: boolean;
  newsLive: boolean;
  newsNote: string | null;
  onRefresh: () => void;
  onCollapse: () => void;
  fillHeight: boolean;
}) {
  return (
    <div
      className={cn(
        "bento flex flex-col overflow-hidden",
        fillHeight && "h-full min-h-0"
      )}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-border/50 px-4 py-3">
        <Newspaper className="h-3.5 w-3.5 text-[var(--brand)]" />
        <p className="text-sm font-semibold">News feed</p>
        {newsLive && !newsLoading ? (
          <span className="rounded-full bg-[color-mix(in_srgb,var(--success)_16%,transparent)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--success)]">
            Live
          </span>
        ) : null}
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={onRefresh}
            disabled={newsLoading}
            className="rounded-lg px-2 py-1 text-[10px] text-muted-foreground hover:bg-muted/50 hover:text-foreground disabled:opacity-50"
          >
            {newsLoading ? "…" : "Refresh"}
          </button>
          <button
            type="button"
            onClick={onCollapse}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            aria-label="Collapse news feed"
            title="Collapse"
          >
            {fillHeight ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <p className="shrink-0 px-4 pt-3 text-[11px] leading-relaxed text-muted-foreground">
        Context only — never size a swap from headlines.
      </p>

      {newsNote ? (
        <p className="mx-4 mt-2 shrink-0 rounded-xl bg-muted/50 px-2.5 py-1.5 text-[10px] text-muted-foreground">
          {newsNote}
        </p>
      ) : null}

      <div
        className={cn(
          "brand-scroll mt-3 min-h-0 flex-1 px-3 pb-3",
          fillHeight ? "overflow-y-auto" : "max-h-[28rem] overflow-y-auto"
        )}
      >
        {newsLoading && news.length === 0 ? (
          <div className="flex items-center gap-2 py-10 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading…
          </div>
        ) : (
          <ul className="space-y-2">
            {news.map((n) => (
              <li key={n.id}>
                <a
                  href={n.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-2xl bg-muted/45 px-3 py-2.5 transition-colors hover:bg-[color-mix(in_srgb,var(--brand)_10%,transparent)]"
                >
                  <p className="text-xs font-medium leading-snug">{n.title}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {n.source}
                    {n.published ? ` · ${n.published}` : ""}
                  </p>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
