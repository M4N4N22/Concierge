"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { formatUnits } from "viem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_MANDATE,
  TRADE_SUGGEST_QUESTION,
  createWalletProposal,
  mandateWithinLimits,
  tradeExecutionEvidence,
  type TradeMandate,
  type TradeProposal,
  type TradeQuote,
  type TradeSuggestion,
} from "@/lib/trade";
import { useTradeExecution } from "@/hooks/useTradeExecution";
import { useTradeBalances } from "@/hooks/useTradeBalances";
import { useAddToVault } from "@/hooks/useAddToVault";
import { registerEvidencePack } from "@/lib/evidence";
import { boardAuthMessage } from "@/lib/boardAuthMessage";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getTxExplorerUrl } from "@/lib/explorer";
import { ChevronDown, Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { ComputeSetupDialog } from "@/components/compute/ComputeSetupDialog";
import type { ComputeErrorCode } from "@/lib/computeErrors";

const STORAGE_KEY = "concierge.tradeMandate.v1";

function loadMandate(): TradeMandate {
  if (typeof window === "undefined") return { ...DEFAULT_MANDATE };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_MANDATE, updatedAt: new Date().toISOString() };
    return { ...DEFAULT_MANDATE, ...JSON.parse(raw), allowlist: ["OG/USDC"] };
  } catch {
    return { ...DEFAULT_MANDATE, updatedAt: new Date().toISOString() };
  }
}

function saveMandate(m: TradeMandate) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(m));
}

/** Wallet-first order desk: balances → agent suggest → side/size → quote → confirm. */
export function TradeDesk() {
  const { address, chainId, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { fetchQuote, executeQuote, quoting, executing } = useTradeExecution();
  const { addFile } = useAddToVault();
  const {
    rows,
    loading: balLoading,
    usdcBalance,
    ogSpendable,
    usdcDecimals,
    dex,
  } = useTradeBalances();

  const [mandate, setMandate] = useState<TradeMandate>(DEFAULT_MANDATE);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [proposal, setProposal] = useState<TradeProposal | null>(null);
  const [quote, setQuote] = useState<TradeQuote | null>(null);
  const [lastTx, setLastTx] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState<TradeSuggestion | null>(null);
  const [computeError, setComputeError] = useState<{
    code?: ComputeErrorCode | string;
    title: string;
    message: string;
    detail?: string;
  } | null>(null);
  const [computeOpen, setComputeOpen] = useState(false);

  useEffect(() => {
    setMandate(loadMandate());
  }, []);

  const persist = (next: TradeMandate) => {
    const withTs = {
      ...next,
      allowlist: ["OG/USDC"] as string[],
      updatedAt: new Date().toISOString(),
    };
    setMandate(withTs);
    saveMandate(withTs);
  };

  const amountNum = Number(amount);
  const amountValid = Number.isFinite(amountNum) && amountNum > 0;

  const spendLabel = side === "buy" ? "USDC" : "OG";
  const spendMax = useMemo(() => {
    if (side === "buy") {
      return Number(formatUnits(usdcBalance, usdcDecimals));
    }
    return Number(formatUnits(ogSpendable, 18));
  }, [ogSpendable, side, usdcBalance, usdcDecimals]);

  const balanceSnapshot = useMemo(() => {
    const og = Number(formatUnits(ogSpendable, 18));
    const usdc = Number(formatUnits(usdcBalance, usdcDecimals));
    const wethRow = rows.find((r) => r.id === "weth");
    const weth = wethRow
      ? Number(formatUnits(wethRow.raw, wethRow.decimals))
      : 0;
    return { og, usdc, weth };
  }, [ogSpendable, rows, usdcBalance, usdcDecimals]);

  const applySuggestion = (s: TradeSuggestion) => {
    if (s.side === "hold") {
      toast.message("Agents recommend hold — no order filled");
      return;
    }
    setSide(s.side);
    setAmount(String(s.size));
    setQuote(null);
    setProposal(null);
    toast.success(
      s.side === "buy"
        ? `Filled Buy OG · ${s.size} USDC`
        : `Filled Sell OG · ${s.size} OG`
    );
  };

  const onAskAgents = async () => {
    if (!isConnected || !address) {
      toast.error("Connect wallet");
      return;
    }
    setSuggesting(true);
    setComputeError(null);
    setSuggestion(null);
    try {
      const timestamp = Date.now();
      const message = boardAuthMessage({
        wallet: address,
        timestamp,
        question: TRADE_SUGGEST_QUESTION,
      });
      const signature = await signMessageAsync({ message });
      const res = await fetch("/api/tradeSuggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: address,
          timestamp,
          signature,
          mode: "fast",
          question: TRADE_SUGGEST_QUESTION,
          balances: balanceSnapshot,
          maxNotional: mandate.maxNotional,
          chainId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const err = {
          code: (data.code as string) || "UNKNOWN",
          title: (data.title as string) || "0G Compute unavailable",
          message: (data.error as string) || "Ask agents failed",
          detail: data.detail as string | undefined,
        };
        setComputeError(err);
        if (data.action === "open_compute_setup") {
          setComputeOpen(true);
        }
        toast.error(err.title);
        return;
      }
      setSuggestion(data.suggestion as TradeSuggestion);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Suggest failed";
      setComputeError({
        title: "Request failed",
        message,
      });
      toast.error(message);
    } finally {
      setSuggesting(false);
    }
  };

  const buildProposal = (): TradeProposal | null => {
    if (!amountValid) return null;
    return createWalletProposal({
      side,
      size: amountNum,
      sizeIsQuote: side === "buy",
      mandate,
    });
  };

  const onQuote = async () => {
    const p = buildProposal();
    if (!p) {
      toast.error("Enter an amount");
      return;
    }
    if (side === "buy" && amountNum > spendMax + 1e-9) {
      toast.error("Amount exceeds USDC balance");
      return;
    }
    if (side === "sell" && amountNum > spendMax + 1e-9) {
      toast.error("Amount exceeds OG / W0G balance");
      return;
    }
    const check = mandateWithinLimits(p, mandate);
    if (!check.ok) {
      toast.error(check.reasons[0] ?? "Blocked by policy");
      setProposal(p);
      return;
    }
    setProposal(p);
    setQuote(null);
    setLastTx(null);
    try {
      const q = await fetchQuote(p, chainId ?? 16602);
      if (
        !p.sizeIsQuote &&
        q.mode === "live" &&
        Number(q.amountOut) > mandate.maxNotional
      ) {
        toast.error(
          `Quote out (${q.amountOut} USDC) exceeds max notional ${mandate.maxNotional}`
        );
        setQuote(q);
        setProposal({ ...p, status: "blocked" });
        return;
      }
      setQuote(q);
      setProposal({ ...p, status: "quoted" });
      toast.success(
        q.mode === "live" ? "Quote ready" : "Simulated quote (no live pool)"
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Quote failed");
    }
  };

  const onConfirmExecute = async () => {
    if (!proposal || !quote) return;
    if (!isConnected) {
      toast.error("Connect wallet to confirm");
      return;
    }
    const check = mandateWithinLimits(proposal, mandate);
    if (!check.ok || proposal.status === "blocked") {
      toast.error(check.reasons[0] ?? "Blocked by policy");
      return;
    }
    if (
      !proposal.sizeIsQuote &&
      Number(quote.amountOut) > mandate.maxNotional
    ) {
      toast.error("USDC out exceeds max notional");
      return;
    }

    setProposal({ ...proposal, status: "executing" });
    try {
      const result = await executeQuote(proposal, quote);
      setProposal({ ...proposal, status: "executed" });
      setLastTx(result.txHash ?? null);
      toast.success(
        result.mode === "simulated"
          ? "Recorded as simulated — no on-chain swap"
          : `Swap submitted${result.txHash ? `: ${result.txHash.slice(0, 10)}…` : ""}`
      );
      const pack = tradeExecutionEvidence({
        proposal,
        quote,
        wallet: address,
        txHash: result.txHash,
        approveTxHash: result.approveTxHash,
        mode: result.mode,
        status: "executed",
      });
      await registerEvidencePack(pack, addFile, {
        useTestnet: (chainId ?? 16602) === 16602,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Execution failed";
      setProposal({ ...proposal, status: "failed" });
      toast.error(message);
    }
  };

  const canConfirm =
    !!quote &&
    !!proposal &&
    proposal.status !== "executed" &&
    proposal.status !== "blocked" &&
    proposal.status !== "executing" &&
    !quoting &&
    !executing &&
    !quote.note?.includes("Unsupported pair");

  return (
    <div className="space-y-5">
      {/* Portfolio */}
      <div>
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold tracking-tight">Balances</h2>
          <p className="text-[11px] text-muted-foreground">
            {isConnected
              ? balLoading
                ? "Loading…"
                : dex
                  ? "Wallet on this chain"
                  : "Native only — ERC-20 map missing on this chain"
              : "Connect wallet"}
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {rows.map((r) => (
            <div
              key={r.id}
              className={cn(
                "rounded-2xl border border-border/60 bg-muted/30 px-4 py-3",
                r.spendable &&
                  ((side === "buy" && r.id === "usdc") ||
                    (side === "sell" && r.id === "og")) &&
                  "border-[color-mix(in_srgb,var(--brand)_45%,transparent)] bg-[color-mix(in_srgb,var(--brand)_8%,transparent)]"
              )}
            >
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {r.label}
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {isConnected ? r.balance : "—"}
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {r.note}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Agent suggest */}
      <div className="space-y-3 rounded-2xl border border-border/60 bg-[color-mix(in_srgb,var(--brand)_5%,transparent)] px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--brand)]" />
              <h2 className="text-sm font-semibold tracking-tight">
                Agent suggestion
              </h2>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Live 0G Compute only — no offline fake recommendations. If the
              ledger is missing or unfunded, fix it here before asking again.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void onAskAgents()}
            disabled={!isConnected || suggesting || balLoading}
          >
            {suggesting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Asking…
              </>
            ) : (
              "Ask agents"
            )}
          </Button>
        </div>

        {computeError ? (
          <div className="rounded-2xl border border-[color-mix(in_srgb,var(--danger)_35%,transparent)] bg-[color-mix(in_srgb,var(--danger)_8%,transparent)] px-3.5 py-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--danger)]" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--danger)]">
                  {computeError.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {computeError.message}
                </p>
                {computeError.code ? (
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                    {computeError.code}
                  </p>
                ) : null}
                <Button
                  size="sm"
                  className="mt-3"
                  onClick={() => setComputeOpen(true)}
                >
                  Open 0G Compute setup
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {suggestion ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-semibold uppercase",
                  suggestion.side === "buy" &&
                    "bg-[color-mix(in_srgb,var(--success)_18%,transparent)] text-[var(--success)]",
                  suggestion.side === "sell" &&
                    "bg-[color-mix(in_srgb,var(--danger)_16%,transparent)] text-[var(--danger)]",
                  suggestion.side === "hold" &&
                    "bg-muted text-muted-foreground"
                )}
              >
                {suggestion.side}
              </span>
              {suggestion.side !== "hold" ? (
                <span className="text-sm font-medium tabular-nums">
                  {suggestion.size}{" "}
                  {suggestion.sizeIsQuote ? "USDC" : "OG"}
                </span>
              ) : null}
              <span className="text-[10px] text-muted-foreground">
                {Math.round(suggestion.confidence * 100)}% · {suggestion.source}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {suggestion.rationale}
            </p>
            <ul className="grid gap-2 sm:grid-cols-3">
              {suggestion.agents.map((a) => (
                <li
                  key={a.name}
                  className="rounded-xl bg-background/60 px-3 py-2"
                >
                  <p className="text-[11px] font-semibold">
                    {a.name}{" "}
                    <span className="font-normal text-muted-foreground">
                      · {a.stance}
                    </span>
                  </p>
                  <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
                    {a.note}
                  </p>
                </li>
              ))}
            </ul>
            <Button
              size="sm"
              onClick={() => applySuggestion(suggestion)}
              disabled={suggestion.side === "hold" || suggestion.size <= 0}
            >
              {suggestion.side === "hold" || suggestion.size <= 0
                ? "Hold — nothing to apply"
                : "Apply to order"}
            </Button>
          </div>
        ) : !computeError ? (
          <p className="text-xs text-muted-foreground">
            No suggestion yet. Ask agents after your balances load.
          </p>
        ) : null}
      </div>

      <ComputeSetupDialog
        open={computeOpen}
        onClose={() => setComputeOpen(false)}
        title={computeError?.title}
        message={computeError?.message}
        code={computeError?.code}
        detail={computeError?.detail}
      />

      {/* Order */}
      <div className="space-y-3 border-t border-border/50 pt-5">
        <h2 className="text-sm font-semibold tracking-tight">Order</h2>
        <p className="text-[11px] text-muted-foreground">
          Live route is OG/USDC via Uniswap. WETH is portfolio context only.
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setSide("buy");
              setQuote(null);
              setProposal(null);
            }}
            className={cn(
              "flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors",
              side === "buy"
                ? "bg-[color-mix(in_srgb,var(--success)_18%,transparent)] text-[var(--success)]"
                : "bg-muted/40 text-muted-foreground hover:text-foreground"
            )}
          >
            Buy OG
          </button>
          <button
            type="button"
            onClick={() => {
              setSide("sell");
              setQuote(null);
              setProposal(null);
            }}
            className={cn(
              "flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors",
              side === "sell"
                ? "bg-[color-mix(in_srgb,var(--danger)_16%,transparent)] text-[var(--danger)]"
                : "bg-muted/40 text-muted-foreground hover:text-foreground"
            )}
          >
            Sell OG
          </button>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label className="text-xs text-muted-foreground">
              {side === "buy" ? "USDC to spend" : "OG to sell"}
            </label>
            <button
              type="button"
              className="text-[10px] font-medium text-[var(--brand)] hover:underline"
              disabled={!isConnected || spendMax <= 0}
              onClick={() =>
                setAmount(
                  spendMax > 0
                    ? String(
                        Number(spendMax.toFixed(side === "buy" ? 2 : 6))
                      )
                    : ""
                )
              }
            >
              Max {isConnected ? spendMax.toFixed(side === "buy" ? 2 : 4) : "—"}{" "}
              {spendLabel}
            </button>
          </div>
          <div className="relative">
            <Input
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setQuote(null);
                setProposal(null);
              }}
              className="h-12 pr-16 text-base tabular-nums"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
              {spendLabel}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setPolicyOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-xl px-1 py-1 text-left text-xs text-muted-foreground hover:text-foreground"
        >
          <span>
            Policy · max {mandate.maxNotional} USDC ·{" "}
            {(mandate.maxSlippageBps / 100).toFixed(2)}% slippage · confirm on
          </span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform",
              policyOpen && "rotate-180"
            )}
          />
        </button>
        {policyOpen ? (
          <div className="grid gap-3 rounded-2xl bg-muted/35 p-3 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                Max notional (USDC)
              </p>
              <Input
                type="number"
                min={0}
                value={mandate.maxNotional}
                onChange={(e) =>
                  persist({
                    ...mandate,
                    maxNotional: Number(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                Max slippage (bps)
              </p>
              <Input
                type="number"
                min={0}
                value={mandate.maxSlippageBps}
                onChange={(e) =>
                  persist({
                    ...mandate,
                    maxSlippageBps: Number(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => void onQuote()}
            disabled={!isConnected || !amountValid || quoting}
          >
            {quoting ? "Quoting…" : "Get quote"}
          </Button>
          <Button
            variant="success"
            disabled={!canConfirm}
            onClick={() => void onConfirmExecute()}
          >
            {executing
              ? "Submitting…"
              : quote?.mode === "simulated"
                ? "Confirm (simulated)"
                : "Confirm & swap"}
          </Button>
        </div>
      </div>

      {quote && proposal ? (
        <div className="space-y-2 rounded-2xl border border-border/60 bg-muted/30 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold uppercase tracking-wide text-muted-foreground">
              Quote
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                quote.mode === "live"
                  ? "bg-[color-mix(in_srgb,var(--success)_18%,transparent)] text-[var(--success)]"
                  : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
              )}
            >
              {quote.mode}
            </span>
            <span className="text-muted-foreground">{proposal.pair}</span>
          </div>
          <p className="text-base font-medium tabular-nums">
            {quote.amountIn} {quote.tokenInSymbol} → {quote.amountOut}{" "}
            {quote.tokenOutSymbol}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Min out ({quote.maxSlippageBps} bps): {quote.amountOutMinimum}{" "}
            {quote.tokenOutSymbol}
          </p>
          {lastTx && chainId ? (
            <a
              href={getTxExplorerUrl(chainId, lastTx)}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-xs underline underline-offset-2"
            >
              View swap tx
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
