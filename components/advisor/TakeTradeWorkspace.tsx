"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAccount, useBalance, useChainId } from "wagmi";
import {
  ArrowUpRight,
  CheckCircle2,
  Circle,
  Loader2,
  Newspaper,
  Shield,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BoardWorkspace } from "@/components/board/WarRoom";
import { TradeDesk } from "@/components/trade/TradeDesk";
import type { BoardSession } from "@/lib/board";
import { formatEther } from "viem";
import { cn } from "@/lib/utils";
import { zeroGMainnet, zeroGTestnet } from "@/lib/wagmi/config";

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
    title: "Risk note: never size a swap from headlines alone — use vault + mandate",
    source: "Concierge context",
    url: "https://docs.0g.ai/",
  },
];

function chainLabel(chainId: number) {
  if (chainId === zeroGMainnet.id) return "0G Mainnet";
  if (chainId === zeroGTestnet.id) return "0G Galileo";
  return `Chain ${chainId}`;
}

export function TakeTradeWorkspace() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: bal, isLoading: balLoading } = useBalance({ address });
  const [session, setSession] = useState<BoardSession | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsLive, setNewsLive] = useState(false);
  const [newsNote, setNewsNote] = useState<string | null>(null);
  const [ticket, setTicket] = useState({
    hasProposal: false,
    hasQuote: false,
    status: null as string | null,
  });

  const onTicketChange = useCallback(
    (state: {
      hasProposal: boolean;
      hasQuote: boolean;
      status: string | null;
    }) => {
      setTicket(state);
    },
    []
  );

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

  const balanceLabel =
    !isConnected
      ? "—"
      : balLoading
        ? "…"
        : bal
          ? `${Number(formatEther(bal.value)).toFixed(4)} ${bal.symbol}`
          : "—";

  const step = useMemo(() => {
    if (!session || session.guard?.status === "block") return 1;
    if (ticket.hasQuote) return 3;
    if (ticket.hasProposal) return 2;
    return 2;
  }, [session, ticket.hasProposal, ticket.hasQuote]);

  return (
    <div className="flex flex-col gap-4 pb-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
            Take a trade
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Brief · mandate · execute
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Size from wallet context, let agents brief a strategy, then confirm
            under your mandate. Never auto-executes.
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/dashboard/advisor/talk">
            Talk to your data
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </header>

      <div className="bento flex flex-wrap items-center gap-3 px-4 py-3 sm:gap-5 sm:px-5">
        <StepPill n={1} label="Agent brief" active={step === 1} done={step > 1} />
        <span className="hidden text-muted-foreground sm:inline">→</span>
        <StepPill
          n={2}
          label="Mandate & ticket"
          active={step === 2}
          done={step > 2}
        />
        <span className="hidden text-muted-foreground sm:inline">→</span>
        <StepPill
          n={3}
          label="Quote & confirm"
          active={step === 3}
          done={ticket.status === "executed"}
        />
        {session ? (
          <span className="ml-auto text-[11px] text-muted-foreground">
            Brief · {session.consensus.verdict} ·{" "}
            {Math.round(session.consensus.confidence * 100)}%
            {ticket.status ? ` · Ticket ${ticket.status}` : ""}
          </span>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="bento p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Wallet
            </span>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-4 font-mono text-sm tabular-nums">
            {isConnected && address
              ? `${address.slice(0, 6)}…${address.slice(-4)}`
              : "Not connected"}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {isConnected ? chainLabel(chainId) : "Connect to load balances"}
          </p>
        </div>
        <div className="bento-brand p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/80">Spendable</span>
            <Wallet className="h-4 w-4 text-white/80" />
          </div>
          <p className="mt-4 text-2xl font-semibold tabular-nums text-white">
            {balanceLabel}
          </p>
          <p className="mt-1 text-[11px] text-white/75">
            Native balance — size trades within mandate
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
            <span className="text-xs font-medium text-white/70">Policy</span>
            <Shield className="h-4 w-4 text-white/70" />
          </div>
          <p className="relative mt-4 text-lg font-semibold text-white">
            Human confirm on
          </p>
          <p className="relative mt-1 text-[11px] text-white/65">
            Caps + allowlist gate every proposal
          </p>
        </div>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-4">
          <section className="space-y-2">
            <div className="flex items-baseline justify-between gap-2 px-0.5">
              <h2 className="text-sm font-semibold tracking-tight">
                1 · Agent brief
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Strategy consensus from vault evidence
              </p>
            </div>
            <BoardWorkspace
              intent="trade"
              session={session}
              onSessionChange={setSession}
            />
          </section>

          <section className="space-y-2">
            <div className="flex items-baseline justify-between gap-2 px-0.5">
              <h2 className="text-sm font-semibold tracking-tight">
                2 · Order ticket
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {session
                  ? "Propose from the brief above"
                  : "Run a brief first to unlock propose"}
              </p>
            </div>
            <div
              className={cn(
                "bento p-5 transition-opacity",
                !session && "opacity-70"
              )}
            >
              <TradeDesk session={session} onTicketChange={onTicketChange} />
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-3 xl:sticky xl:top-4 xl:max-h-[calc(100vh-5rem)] xl:overflow-y-auto brand-scroll">
          <div className="bento p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Newspaper className="h-3.5 w-3.5 text-[var(--brand)]" />
                <p className="text-sm font-semibold">Market pulse</p>
                {newsLive && !newsLoading ? (
                  <span className="rounded-full bg-[color-mix(in_srgb,var(--success)_16%,transparent)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--success)]">
                    Live
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => void loadNews()}
                disabled={newsLoading}
                className="text-[10px] text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                {newsLoading ? "…" : "Refresh"}
              </button>
            </div>
            <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
              Public headlines for context only — never auto-trade on news.
            </p>
            {newsNote ? (
              <p className="mb-2 rounded-xl bg-muted/50 px-2.5 py-1.5 text-[10px] text-muted-foreground">
                {newsNote}
              </p>
            ) : null}
            {newsLoading && news.length === 0 ? (
              <div className="flex items-center gap-2 py-8 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading headlines…
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
                      <p className="text-xs font-medium leading-snug">
                        {n.title}
                      </p>
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

          <div className="bento p-4">
            <p className="text-sm font-semibold">How this desk works</p>
            <ol className="mt-2 space-y-2 text-[11px] leading-relaxed text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">Brief</span> —
                agents debate buy / sell / hold from vault facts.
              </li>
              <li>
                <span className="font-medium text-foreground">Mandate</span> —
                notional, slippage, and pair allowlist must pass.
              </li>
              <li>
                <span className="font-medium text-foreground">Execute</span> —
                quote then human confirm. Simulated when pools are empty.
              </li>
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StepPill({
  n,
  label,
  active,
  done,
}: {
  n: number;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs",
        active &&
          "bg-[color-mix(in_srgb,var(--brand)_14%,transparent)] text-foreground",
        done && !active && "text-[var(--success)]",
        !active && !done && "text-muted-foreground"
      )}
    >
      {done ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : active ? (
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--brand)] text-[9px] font-semibold text-white">
          {n}
        </span>
      ) : (
        <Circle className="h-3.5 w-3.5 opacity-50" />
      )}
      {label}
    </div>
  );
}
