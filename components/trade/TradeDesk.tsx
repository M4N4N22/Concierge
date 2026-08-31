"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldLabel } from "@/components/ui/hint";
import { PanelHeader } from "@/components/ui/panel";
import {
  DEFAULT_MANDATE,
  mandateWithinLimits,
  proposeTradeFromBoard,
  tradeExecutionEvidence,
  type TradeMandate,
  type TradeProposal,
  type TradeQuote,
} from "@/lib/trade";
import type { BoardSession } from "@/lib/board";
import { useTradeExecution } from "@/hooks/useTradeExecution";
import { useAddToVault } from "@/hooks/useAddToVault";
import { registerEvidencePack } from "@/lib/evidence";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getTxExplorerUrl } from "@/lib/explorer";

const STORAGE_KEY = "concierge.tradeMandate.v1";

function loadMandate(): TradeMandate {
  if (typeof window === "undefined") return { ...DEFAULT_MANDATE };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_MANDATE, updatedAt: new Date().toISOString() };
    return { ...DEFAULT_MANDATE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_MANDATE, updatedAt: new Date().toISOString() };
  }
}

function saveMandate(m: TradeMandate) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(m));
}

export function TradeDesk({
  session,
  onTicketChange,
}: {
  session: BoardSession | null;
  onTicketChange?: (state: {
    hasProposal: boolean;
    hasQuote: boolean;
    status: TradeProposal["status"] | null;
  }) => void;
}) {
  const { address, chainId, isConnected } = useAccount();
  const { fetchQuote, executeQuote, quoting, executing } = useTradeExecution();
  const { addFile } = useAddToVault();

  const [mandate, setMandate] = useState<TradeMandate>(DEFAULT_MANDATE);
  const [allowlistInput, setAllowlistInput] = useState("");
  const [proposal, setProposal] = useState<TradeProposal | null>(null);
  const [quote, setQuote] = useState<TradeQuote | null>(null);
  const [lastTx, setLastTx] = useState<string | null>(null);

  useEffect(() => {
    onTicketChange?.({
      hasProposal: !!proposal,
      hasQuote: !!quote,
      status: proposal?.status ?? null,
    });
  }, [proposal, quote, onTicketChange]);

  useEffect(() => {
    const m = loadMandate();
    setMandate(m);
    setAllowlistInput(m.allowlist.join(", "));
  }, []);

  useEffect(() => {
    setProposal(null);
    setQuote(null);
    setLastTx(null);
  }, [session?.id]);

  const persist = (next: TradeMandate) => {
    const withTs = { ...next, updatedAt: new Date().toISOString() };
    setMandate(withTs);
    saveMandate(withTs);
  };

  const onPropose = () => {
    if (!session) {
      toast.error("Run a trade brief first (Trade mode)");
      return;
    }
    const p = proposeTradeFromBoard(session, mandate);
    setProposal(p);
    setQuote(null);
    setLastTx(null);
    toast.message(
      p.status === "blocked"
        ? "Trade blocked by policy / firewall"
        : "Trade proposal ready — get a quote, then confirm"
    );
  };

  const onQuote = async () => {
    if (!proposal) return;
    const check = mandateWithinLimits(proposal, mandate);
    if (!check.ok || proposal.status === "blocked") {
      toast.error("Proposal fails mandate — fix allowlist / size first");
      return;
    }
    try {
      const q = await fetchQuote(proposal, chainId ?? 16602);
      setQuote(q);
      setProposal({ ...proposal, status: "quoted" });
      toast.success(
        q.mode === "live" ? "Live Uniswap quote ready" : "Simulated quote ready"
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Quote failed");
    }
  };

  const onConfirmExecute = async () => {
    if (!proposal || !quote) return;
    if (mandate.requireConfirm && !isConnected) {
      toast.error("Connect wallet to confirm execution");
      return;
    }
    const check = mandateWithinLimits(proposal, mandate);
    if (!check.ok) {
      toast.error(check.reasons[0] ?? "Blocked by mandate");
      return;
    }

    setProposal({ ...proposal, status: "executing" });
    try {
      const result = await executeQuote(proposal, quote);
      const status = "executed" as const;
      setProposal({ ...proposal, status });
      setLastTx(result.txHash ?? null);

      if (result.mode === "simulated") {
        toast.success(
          "Simulated execution recorded — no on-chain swap (liquidity / testnet)"
        );
      } else {
        toast.success(`Swap submitted${result.txHash ? `: ${result.txHash.slice(0, 10)}…` : ""}`);
      }

      const pack = tradeExecutionEvidence({
        proposal,
        quote,
        wallet: address,
        txHash: result.txHash,
        approveTxHash: result.approveTxHash,
        mode: result.mode,
        status,
      });
      await registerEvidencePack(pack, addFile, {
        useTestnet: (chainId ?? 16602) === 16602,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Execution failed";
      setProposal({ ...proposal, status: "failed" });
      toast.error(message);
      if (quote) {
        const pack = tradeExecutionEvidence({
          proposal,
          quote,
          wallet: address,
          mode: quote.mode,
          status: "failed",
          error: message,
        });
        await registerEvidencePack(pack, addFile, {
          useTestnet: (chainId ?? 16602) === 16602,
        });
      }
    }
  };

  const check = proposal ? mandateWithinLimits(proposal, mandate) : null;
  const canQuote =
    !!proposal &&
    check?.ok &&
    proposal.status !== "blocked" &&
    proposal.status !== "executed" &&
    proposal.status !== "executing";
  const canExecute =
    !!quote &&
    canQuote &&
    proposal?.status !== "executed" &&
    !quoting &&
    !executing;

  return (
    <div className="space-y-3">
      <div>
        <PanelHeader
          title="Trade mandate"
          hint="Caps and allowlists for trade-brief proposals. Default is human-confirm only."
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <FieldLabel hint="Hard cap per proposal (quote units).">
              Max notional
            </FieldLabel>
            <Input
              type="number"
              min={0}
              value={mandate.maxNotional}
              onChange={(e) =>
                persist({ ...mandate, maxNotional: Number(e.target.value) || 0 })
              }
            />
          </div>
          <div>
            <FieldLabel hint="Max slippage in basis points (50 = 0.50%).">
              Max slippage (bps)
            </FieldLabel>
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
          <div>
            <FieldLabel hint="Comma-separated pairs, e.g. OG/USDC. Empty = all pairs allowed.">
              Allowlist
            </FieldLabel>
            <Input
              value={allowlistInput}
              placeholder="OG/USDC"
              onChange={(e) => setAllowlistInput(e.target.value)}
              onBlur={() =>
                persist({
                  ...mandate,
                  allowlist: allowlistInput
                    .split(",")
                    .map((s) => s.trim().toUpperCase())
                    .filter(Boolean),
                })
              }
            />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="accent-[var(--brand)]"
              checked={mandate.requireConfirm}
              onChange={(e) =>
                persist({ ...mandate, requireConfirm: e.target.checked })
              }
            />
            Require confirm
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer opacity-60">
            <input
              type="checkbox"
              className="accent-foreground"
              checked={mandate.autonomous}
              disabled
              onChange={() => undefined}
            />
            Autonomous exec (soon)
          </label>
        </div>
      </div>

      <div className="border-t border-border/50 pt-4">
        <PanelHeader
          title="Trade proposal"
          hint="Trade brief → Uniswap quote → human confirm. Never auto-executes."
          action={
            <Button size="sm" onClick={onPropose} disabled={!session}>
              Propose from brief
            </Button>
          }
        />

        {!proposal ? (
          <div className="rounded-2xl bg-muted/40 px-4 py-6 text-center">
            <p className="text-sm font-medium">
              {session ? "Ready to propose" : "Waiting on a trade brief"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {session
                ? "Click Propose from brief to build a mandate-checked ticket."
                : "Complete step 1 above so agents can recommend a side and size."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="Pair" value={proposal.pair} />
              <Stat
                label="Side"
                value={proposal.side.toUpperCase()}
                tone={
                  proposal.side === "buy"
                    ? "success"
                    : proposal.side === "sell"
                      ? "danger"
                      : "muted"
                }
              />
              <Stat label="Size" value={String(proposal.size)} />
              <Stat label="Status" value={proposal.status} />
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {proposal.rationale}
            </p>
            {check && !check.ok && (
              <ul className="space-y-0.5 rounded-2xl bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] px-3 py-2 text-xs text-[var(--danger)]">
                {check.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}

            {quote && (
              <div className="space-y-1.5 rounded-2xl bg-muted/50 px-3.5 py-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="uppercase tracking-wide text-muted-foreground">
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
                </div>
                <p className="text-sm tabular-nums">
                  {quote.amountIn} {quote.tokenInSymbol} → {quote.amountOut}{" "}
                  {quote.tokenOutSymbol}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Min out ({quote.maxSlippageBps} bps): {quote.amountOutMinimum}{" "}
                  {quote.tokenOutSymbol}
                  {quote.note ? ` · ${quote.note}` : ""}
                </p>
              </div>
            )}

            {lastTx && chainId && (
              <a
                href={getTxExplorerUrl(chainId, lastTx)}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-foreground underline underline-offset-2"
              >
                View swap tx
              </a>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={!canQuote || quoting}
                onClick={onQuote}
              >
                {quoting ? "Quoting…" : "Get quote"}
              </Button>
              <Button
                size="sm"
                variant="success"
                disabled={!canExecute}
                onClick={onConfirmExecute}
              >
                {executing
                  ? "Executing…"
                  : quote?.mode === "simulated"
                    ? "Confirm (simulated)"
                    : "Confirm & swap"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setProposal({ ...proposal, status: "cancelled" });
                  setQuote(null);
                }}
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "muted",
}: {
  label: string;
  value: string;
  tone?: "muted" | "success" | "danger";
}) {
  return (
    <div className="rounded-2xl bg-muted/50 px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-sm font-medium tabular-nums",
          tone === "success" && "text-[var(--success)]",
          tone === "danger" && "text-[var(--danger)]"
        )}
      >
        {value}
      </p>
    </div>
  );
}
