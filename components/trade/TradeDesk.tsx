"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldLabel } from "@/components/ui/hint";
import { Panel, PanelHeader } from "@/components/ui/panel";
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

export function TradeDesk({ session }: { session: BoardSession | null }) {
  const { address, chainId, isConnected } = useAccount();
  const { fetchQuote, executeQuote, quoting, executing } = useTradeExecution();
  const { addFile } = useAddToVault();

  const [mandate, setMandate] = useState<TradeMandate>(DEFAULT_MANDATE);
  const [allowlistInput, setAllowlistInput] = useState("");
  const [proposal, setProposal] = useState<TradeProposal | null>(null);
  const [quote, setQuote] = useState<TradeQuote | null>(null);
  const [lastTx, setLastTx] = useState<string | null>(null);

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
      toast.error("Run a board session first");
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
      <Panel>
        <PanelHeader
          title="Trade mandate"
          hint="Caps and allowlists for any board-originated trade. Default is human-confirm only — no blind swaps."
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
              className="accent-foreground"
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
      </Panel>

      <Panel>
        <PanelHeader
          title="Trade proposal"
          hint="Board → Uniswap quote (live on mainnet when liquidity exists) → human confirm. Never auto-executes."
          action={
            <Button size="sm" onClick={onPropose} disabled={!session}>
              Propose from board
            </Button>
          }
        />

        {!proposal ? (
          <p className="text-xs text-muted-foreground">
            No proposal yet. Convene the board, then propose.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
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
            <p className="text-xs text-muted-foreground leading-relaxed">
              {proposal.rationale}
            </p>
            {check && !check.ok && (
              <ul className="text-xs text-[var(--danger)] space-y-0.5">
                {check.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}

            {quote && (
              <div className="rounded-md bg-muted/50 px-3 py-2.5 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="uppercase tracking-wide text-muted-foreground">
                    Quote
                  </span>
                  <span
                    className={cn(
                      "font-medium",
                      quote.mode === "live"
                        ? "text-[var(--success)]"
                        : "text-amber-600"
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
      </Panel>
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
    <div className="rounded-md bg-muted/50 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 font-medium tabular-nums",
          tone === "success" && "text-[var(--success)]",
          tone === "danger" && "text-[var(--danger)]"
        )}
      >
        {value}
      </p>
    </div>
  );
}
