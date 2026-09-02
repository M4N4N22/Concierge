"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_MANDATE,
  createWalletProposal,
  mandateWithinLimits,
  tradeExecutionEvidence,
  gateLabel,
  type TradeMandate,
  type TradeProposal,
  type TradeQuote,
  type TradeSuggestion,
} from "@/lib/trade";
import { useTradeExecution } from "@/hooks/useTradeExecution";
import { useTradeBalances } from "@/hooks/useTradeBalances";
import { useAddToVault } from "@/hooks/useAddToVault";
import {
  useTradeOrchestration,
  type OrchestrationRunResult,
  type TradeOrchestration,
} from "@/hooks/useTradeOrchestration";
import { usePortfolioWatcher } from "@/hooks/usePortfolioWatcher";
import { PortfolioWatcherPanel } from "@/components/trade/PortfolioWatcherPanel";
import { registerEvidencePack } from "@/lib/evidence";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getTxExplorerUrl } from "@/lib/explorer";
import { ChevronDown, Loader2, Sparkles, AlertTriangle, Bot, ArrowRightLeft } from "lucide-react";
import { ComputeSetupDialog } from "@/components/compute/ComputeSetupDialog";

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

/** Wallet-first order desk: agents → watcher → quote → confirm. */
export function TradeDesk({ hideBalanceStats = false }: { hideBalanceStats?: boolean }) {
  const { address, chainId, isConnected } = useAccount();
  const { fetchQuote, executeQuote, quoting, executing } = useTradeExecution();
  const { addFile } = useAddToVault();
  const {
    running: suggesting,
    error: computeError,
    setError: setComputeError,
    runOrchestration,
  } = useTradeOrchestration();
  const {
    rows,
    loading: balLoading,
    usdcBalance,
    ogSpendable,
    usdcDecimals,
    refresh,
  } = useTradeBalances();

  const [mandate, setMandate] = useState<TradeMandate>(DEFAULT_MANDATE);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [proposal, setProposal] = useState<TradeProposal | null>(null);
  const [quote, setQuote] = useState<TradeQuote | null>(null);
  const [lastTx, setLastTx] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<TradeSuggestion | null>(null);
  const [orchestration, setOrchestration] = useState<TradeOrchestration | null>(
    null
  );
  const [memoryRootHash, setMemoryRootHash] = useState<string | null>(null);
  const [computeOpen, setComputeOpen] = useState(false);

  const balanceSnapshot = useMemo(() => {
    const og = Number(formatUnits(ogSpendable, 18));
    const usdc = Number(formatUnits(usdcBalance, usdcDecimals));
    const wethRow = rows.find((r) => r.id === "weth");
    const weth = wethRow
      ? Number(formatUnits(wethRow.raw, wethRow.decimals))
      : 0;
    return { og, usdc, weth };
  }, [ogSpendable, rows, usdcBalance, usdcDecimals]);

  const applyOrchestration = useCallback((result: OrchestrationRunResult) => {
    setOrchestration(result.orchestration);
    setSuggestion(result.orchestration.suggestion);
    if (result.memoryRootHash) setMemoryRootHash(result.memoryRootHash);
  }, []);

  const watcher = usePortfolioWatcher({
    balances: balanceSnapshot,
    mandate,
    balLoading,
    refreshBalances: refresh,
    onOrchestration: applyOrchestration,
  });

  useEffect(() => {
    setMandate(loadMandate());
  }, []);

  useEffect(() => {
    if (computeError?.action === "open_compute_setup") {
      setComputeOpen(true);
    }
  }, [computeError]);

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
    setComputeError(null);
    setSuggestion(null);
    setOrchestration(null);
    setMemoryRootHash(null);
    const result = await runOrchestration({
      balances: balanceSnapshot,
      mandate,
    });
    if (result) applyOrchestration(result);
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
    <div className="flex flex-col gap-4">
      {!hideBalanceStats ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {rows.map((r) => (
            <div key={r.id} className="bento p-5">
              <p className="text-xs font-medium text-muted-foreground">
                {r.label}
              </p>
              <p className="mt-3 text-2xl font-semibold tabular-nums">
                {isConnected ? r.balance : "—"}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">{r.note}</p>
            </div>
          ))}
        </div>
      ) : null}

      <PortfolioWatcherPanel
        status={watcher.status}
        disabled={!isConnected || balLoading}
        onEnable={() => void watcher.enableWatcher()}
        onDisable={watcher.disableWatcher}
        onRefresh={() => void watcher.runCheck({ forceOrchestrate: false })}
        onOrchestratePending={() => void watcher.orchestratePending()}
        onDismissPending={watcher.dismissPending}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        {/* Agent orchestration */}
        <section className="bento-brand flex flex-col overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-white/90" />
                <h2 className="text-sm font-semibold text-white">
                  Agent orchestration
                </h2>
              </div>
              <p className="mt-1 text-[11px] text-white/75">
                Consensus + gatekeeper on 0G Compute
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="rounded-full bg-white/15 text-white hover:bg-white/25"
              onClick={() => void onAskAgents()}
              disabled={!isConnected || suggesting || balLoading}
            >
              {suggesting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Running…
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Ask agents
                </>
              )}
            </Button>
          </div>

          <div className="flex flex-1 flex-col px-5 py-4">
            {computeError ? (
              <div className="rounded-2xl bg-black/20 px-4 py-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">
                      {computeError.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-white/70">
                      {computeError.message}
                    </p>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="mt-3 rounded-full bg-white/15 text-white hover:bg-white/25"
                      onClick={() => setComputeOpen(true)}
                    >
                      Open Compute setup
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}

            {suggestion ? (
              <div className="space-y-3">
                {orchestration ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[10px] font-semibold    ",
                        orchestration.gate === "AUTO_EXECUTE" &&
                          "bg-white/20 text-white",
                        orchestration.gate === "NEEDS_APPROVAL" &&
                          "bg-amber-400/20 text-amber-100",
                        orchestration.gate === "BLOCKED" &&
                          "bg-red-400/20 text-red-100"
                      )}
                    >
                      {gateLabel(orchestration.gate)}
                    </span>
                    <span className="text-[10px] text-white/70">
                      {Math.round(orchestration.consensus.agreement * 100)}%
                      agreement ·{" "}
                      {Math.round(orchestration.consensus.confidence * 100)}%
                      confidence
                    </span>
                    {memoryRootHash ? (
                      <span className="text-[10px] text-white/90">
                        · saved to vault
                      </span>
                    ) : null}
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-semibold  ",
                      suggestion.side === "buy" && "bg-white text-[var(--brand)]",
                      suggestion.side === "sell" && "bg-red-100 text-red-800",
                      suggestion.side === "hold" && "bg-white/20 text-white"
                    )}
                  >
                    {suggestion.side}
                  </span>
                  {suggestion.side !== "hold" ? (
                    <span className="text-sm font-medium tabular-nums text-white">
                      {suggestion.size}{" "}
                      {suggestion.sizeIsQuote ? "USDC" : "OG"}
                    </span>
                  ) : null}
                </div>

                <p className="text-xs leading-relaxed text-white/80">
                  {suggestion.rationale}
                </p>

                <ul className="grid gap-2 sm:grid-cols-3">
                  {(orchestration?.consensus.votes ??
                    suggestion.agents.map((a) => ({
                      name: a.name,
                      side: a.stance as TradeSuggestion["side"],
                      weight: 0.33,
                      confidence: suggestion.confidence,
                      note: a.note,
                    }))).map((a) => (
                    <li
                      key={a.name}
                      className="rounded-xl bg-black/15 px-3 py-2.5"
                    >
                      <p className="text-[11px] font-semibold text-white">
                        {a.name}{" "}
                        <span className="font-normal text-white/60">
                          · {a.side}
                        </span>
                      </p>
                      <p className="mt-0.5 text-[10px] leading-snug text-white/65">
                        {a.note}
                      </p>
                    </li>
                  ))}
                </ul>

                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-full bg-white text-[var(--brand)] hover:bg-white/90"
                  onClick={() => applySuggestion(suggestion)}
                  disabled={
                    suggestion.side === "hold" ||
                    suggestion.size <= 0 ||
                    orchestration?.gate === "BLOCKED"
                  }
                >
                  Apply to order
                </Button>
              </div>
            ) : !computeError ? (
              <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
                <Sparkles className="mb-3 h-8 w-8 text-white/40" />
                <p className="text-sm font-medium text-white">
                  No agent run yet
                </p>
                <p className="mt-1 max-w-xs text-[11px] text-white/65">
                  Ask agents after balances load, or enable the portfolio
                  watcher to re-run on shifts.
                </p>
              </div>
            ) : null}
          </div>
        </section>

        {/* Order ticket */}
        <section className="bento flex flex-col overflow-hidden">
          <div className="border-b border-border/50 px-5 py-4">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-[var(--brand)]" />
              <h2 className="text-sm font-semibold  ">
                Order ticket
              </h2>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              OG/USDC via Uniswap · you confirm every swap
            </p>
          </div>

          <div className="flex flex-1 flex-col gap-4 px-5 py-4">
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted/40 p-1">
              <button
                type="button"
                onClick={() => {
                  setSide("buy");
                  setQuote(null);
                  setProposal(null);
                }}
                className={cn(
                  "rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
                  side === "buy"
                    ? "bg-[color-mix(in_srgb,var(--success)_18%,transparent)] text-[var(--success)] shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
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
                  "rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
                  side === "sell"
                    ? "bg-[color-mix(in_srgb,var(--danger)_16%,transparent)] text-[var(--danger)] shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Sell OG
              </button>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label className="text-xs font-medium text-muted-foreground">
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
                  className="h-12 border-0 bg-muted/45 pr-16 text-base tabular-nums shadow-none focus-visible:ring-[var(--brand)]"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                  {spendLabel}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPolicyOpen((o) => !o)}
              className="flex w-full items-center justify-between rounded-xl bg-muted/35 px-3 py-2.5 text-left text-xs text-muted-foreground hover:text-foreground"
            >
              <span>
                Policy · max {mandate.maxNotional} USDC ·{" "}
                {(mandate.maxSlippageBps / 100).toFixed(2)}% slippage
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
                  <p className="mb-1 text-[10px]     text-muted-foreground">
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
                    className="border-0 bg-background/60"
                  />
                </div>
                <div>
                  <p className="mb-1 text-[10px]     text-muted-foreground">
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
                    className="border-0 bg-background/60"
                  />
                </div>
                <label className="flex items-center gap-2 rounded-xl bg-background/60 px-3 py-2.5 sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={mandate.autonomous}
                    onChange={(e) =>
                      persist({ ...mandate, autonomous: e.target.checked })
                    }
                    className="size-4 rounded border-border"
                  />
                  <span className="text-xs text-muted-foreground">
                    Auto-eligible gate when consensus passes (swaps still need
                    wallet confirm)
                  </span>
                </label>
              </div>
            ) : null}

            <div className="mt-auto flex flex-wrap gap-2">
              <Button
                className="rounded-full"
                onClick={() => void onQuote()}
                disabled={!isConnected || !amountValid || quoting}
              >
                {quoting ? "Quoting…" : "Get quote"}
              </Button>
              <Button
                variant="success"
                className="rounded-full"
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
        </section>
      </div>

      <ComputeSetupDialog
        open={computeOpen}
        onClose={() => setComputeOpen(false)}
        title={computeError?.title}
        message={computeError?.message}
        code={computeError?.code}
        detail={computeError?.detail}
      />

      {quote && proposal ? (
        <section className="bento-ink relative overflow-hidden p-5 sm:p-6">
          <div className="relative flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold     text-white/60">
              Quote ready
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold  ",
                quote.mode === "live"
                  ? "bg-[color-mix(in_srgb,var(--success)_25%,transparent)] text-emerald-200"
                  : "bg-amber-400/20 text-amber-100"
              )}
            >
              {quote.mode}
            </span>
            {orchestration ? (
              <span className="text-[10px] text-white/55">
                Gate: {gateLabel(orchestration.gate)}
              </span>
            ) : null}
          </div>
          <p className="relative mt-4 text-2xl font-semibold tabular-nums text-white">
            {quote.amountIn} {quote.tokenInSymbol}
            <span className="mx-2 text-white/40">→</span>
            {quote.amountOut} {quote.tokenOutSymbol}
          </p>
          <p className="relative mt-2 text-[11px] text-white/60">
            Min out ({quote.maxSlippageBps} bps): {quote.amountOutMinimum}{" "}
            {quote.tokenOutSymbol} · {proposal.pair}
          </p>
          {lastTx && chainId ? (
            <a
              href={getTxExplorerUrl(chainId, lastTx)}
              target="_blank"
              rel="noreferrer"
              className="relative mt-3 inline-block text-xs text-white/80 underline underline-offset-2 hover:text-white"
            >
              View swap transaction
            </a>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
