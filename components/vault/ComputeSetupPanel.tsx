"use client";

import {
  Wallet,
  PlusCircle,
  ArrowDownToLine,
  Cpu,
  CheckCircle2,
  Circle,
  Loader2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useComputeLedgerContext } from "@/components/vault/ComputeLedgerContext";
import { formatOG, type ComputeModel } from "@/hooks/useComputeLedger";
import { MIN_LEDGER_CREATE_OG, MIN_PROVIDER_FUND_OG } from "@/lib/computeConstants";
import { getOgFundingLinks } from "@/lib/computeFunding";
import { useState } from "react";
import Link from "next/link";

const SETUP_STEPS = [
  { id: "ledger", label: "Create ledger", detail: "Register on 0G Compute" },
  { id: "fund", label: "Fund ledger", detail: "Deposit OG for inference" },
  { id: "provider", label: "Fund provider", detail: "Enable an AI model" },
  { id: "compute", label: "Run inference", detail: "Analyze vault files" },
] as const;

function stepStatus(
  id: (typeof SETUP_STEPS)[number]["id"],
  readiness: ReturnType<typeof useComputeLedgerContext>["readiness"]
): "done" | "current" | "pending" {
  if (id === "ledger") {
    if (readiness.hasLedger) return "done";
    return "current";
  }
  if (id === "fund") {
    if (!readiness.hasLedger) return "pending";
    if (readiness.hasBalance) return "done";
    return "current";
  }
  if (id === "provider") {
    if (!readiness.hasBalance) return "pending";
    if (readiness.hasFundedProvider) return "done";
    return "current";
  }
  if (readiness.canCompute) return "done";
  if (readiness.hasFundedProvider) return "current";
  return "pending";
}

function ModelCard({
  model,
  availableOG,
  funded,
  actionLoading,
  onFund,
}: {
  model: ComputeModel;
  availableOG: number;
  funded: boolean;
  actionLoading: string | null;
  onFund: (provider: string, amount: number) => void;
}) {
  const minOG = Number(model.minUnits) / 1e18;
  const canFund = availableOG >= MIN_PROVIDER_FUND_OG;
  const loading = actionLoading === `fund-${model.provider}`;

  return (
    <div
      className={cn(
        "rounded-2xl bg-muted/45 p-4 transition-colors",
        funded && "bg-[color-mix(in_srgb,var(--success)_10%,var(--surface))]"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {model.tags && (
            <div className="mb-2 flex flex-wrap gap-1">
              {model.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[color-mix(in_srgb,var(--brand)_14%,transparent)] px-2 py-0.5 text-[10px] font-medium text-[var(--brand)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <p className="truncate text-sm font-semibold">{model.model}</p>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
            {model.provider.slice(0, 10)}…{model.provider.slice(-6)}
          </p>
        </div>
        {funded ? (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--success)]" />
        ) : (
          <Cpu className="h-5 w-5 shrink-0 text-muted-foreground/50" />
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>Min: {formatOG(minOG)} OG</span>
        <span>Verify: {model.verifiability || "—"}</span>
      </div>

      {!funded && (
        <div className="mt-3 space-y-2">
          <p className="text-[11px] text-muted-foreground">
            Min {MIN_PROVIDER_FUND_OG} OG per provider (0G Compute requirement)
          </p>
          <div className="flex flex-wrap gap-2">
            {[1, 2].map((amt) => (
              <Button
                key={amt}
                size="sm"
                variant="outline"
                disabled={!canFund || loading || amt > availableOG}
                onClick={() => onFund(model.provider, amt)}
              >
                Fund {amt} OG
              </Button>
            ))}
          </div>
        </div>
      )}

      {funded && (
        <p className="mt-3 text-xs font-medium text-[var(--success)]">
          Ready for inference
        </p>
      )}
    </div>
  );
}

export default function ComputeSetupPanel() {
  const {
    models,
    ledger,
    ledgerExists,
    broker,
    fundedProviders,
    loading,
    actionLoading,
    availableOG,
    totalOG,
    readiness,
    refresh,
    createLedger,
    deposit,
    fundProvider,
    chainId,
  } = useComputeLedgerContext();

  const [depositAmount, setDepositAmount] = useState("0.5");
  const completedSteps = SETUP_STEPS.filter(
    (s) => stepStatus(s.id, readiness) === "done"
  ).length;
  const progressPercent = Math.round(
    (completedSteps / SETUP_STEPS.length) * 100
  );

  const isTestnet = broker?.isTestnet ?? chainId !== 16661;
  const shortfall = broker?.shortfallOg ?? MIN_LEDGER_CREATE_OG;
  const canCreate = broker?.canCreateLedger ?? false;
  const fundingLinks = getOgFundingLinks(isTestnet);

  return (
    <div className="space-y-3">
      {/* Broker wallet + network balance */}
      <section className="bento overflow-hidden">
        <div className="px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold  ">
                Broker wallet
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Pays gas + the {MIN_LEDGER_CREATE_OG} OG needed to create a
                compute ledger
              </p>
            </div>
            {broker ? (
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-[10px] font-semibold    ",
                  broker.isTestnet
                    ? "bg-muted text-muted-foreground"
                    : "bg-[color-mix(in_srgb,var(--brand)_14%,transparent)] text-[var(--brand)]"
                )}
              >
                {broker.network}
              </span>
            ) : null}
          </div>
        </div>

        <div className="space-y-3 border-t border-border/50 px-5 py-4">
          {loading && !broker ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading broker balance…
            </div>
          ) : broker ? (
            <>
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-2xl bg-muted/40 px-3 py-3">
                  <p className="text-[10px]     text-muted-foreground">
                    Available
                  </p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">
                    {formatOG(broker.nativeBalanceOg)}{" "}
                    <span className="text-sm font-medium text-muted-foreground">
                      OG
                    </span>
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    Native on {broker.isTestnet ? "testnet" : "mainnet"}
                  </p>
                </div>
                <div className="rounded-2xl bg-muted/40 px-3 py-3">
                  <p className="text-[10px]     text-muted-foreground">
                    Required
                  </p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">
                    {MIN_LEDGER_CREATE_OG}{" "}
                    <span className="text-sm font-medium text-muted-foreground">
                      OG
                    </span>
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    Min to create ledger
                  </p>
                </div>
                <div
                  className={cn(
                    "rounded-2xl px-3 py-3",
                    shortfall > 0
                      ? "bg-[color-mix(in_srgb,var(--danger)_10%,transparent)]"
                      : "bg-[color-mix(in_srgb,var(--success)_12%,transparent)]"
                  )}
                >
                  <p className="text-[10px]     text-muted-foreground">
                    {shortfall > 0 ? "Short by" : "Status"}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-lg font-semibold tabular-nums",
                      shortfall > 0
                        ? "text-[var(--danger)]"
                        : "text-[var(--success)]"
                    )}
                  >
                    {shortfall > 0
                      ? `${formatOG(shortfall)} OG`
                      : "Ready"}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {shortfall > 0
                      ? "Need more OG on this broker wallet"
                      : "Enough to create ledger"}
                  </p>
                </div>
              </div>

              <p className="font-mono text-[10px] text-muted-foreground">
                {broker.address.slice(0, 10)}…{broker.address.slice(-8)} · chain{" "}
                {broker.chainId}
              </p>

              {shortfall > 0 ? (
                <div className="rounded-2xl border border-border/60 bg-muted/30 px-3.5 py-3">
                  <p className="text-xs font-medium">
                    Fund this broker wallet ({formatOG(shortfall)} OG short)
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {broker.isTestnet
                      ? "On Galileo testnet use the faucet or ask the community for test OG."
                      : "On mainnet buy OG via official guides / DEX, then send to the broker address above."}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {fundingLinks.map((link) =>
                      link.external ? (
                        <a
                          key={link.href}
                          href={link.href}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background px-3 py-1.5 text-[11px] font-medium hover:bg-muted/50"
                        >
                          {link.label}
                          <ExternalLink className="h-3 w-3 opacity-60" />
                        </a>
                      ) : (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background px-3 py-1.5 text-[11px] font-medium hover:bg-muted/50"
                        >
                          {link.label}
                        </Link>
                      )
                    )}
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Could not load broker balance — check{" "}
              {isTestnet
                ? "GALILEO_RPC_URL / GALILEO_PRIVATE_KEY"
                : "OG_MAINNET_RPC_URL / OG_MAINNET_PRIVATE_KEY"}
              .
            </p>
          )}
        </div>
      </section>

      <section className="bento overflow-hidden">
        <div className="px-5 py-4">
          <p className="text-sm font-semibold  ">0G Compute setup</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Create a ledger ({MIN_LEDGER_CREATE_OG} OG), fund it, enable a model
            — then run AI on vault or desk
          </p>
        </div>

        <div className="space-y-3 px-5 pb-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Setup progress</span>
            <span className="font-medium">
              {completedSteps}/{SETUP_STEPS.length} steps
            </span>
          </div>
          <Progress value={progressPercent} className="h-1.5" />
        </div>

        <div className="grid border-t border-border/50 sm:grid-cols-4">
          {SETUP_STEPS.map((step) => {
            const status = stepStatus(step.id, readiness);
            return (
              <div
                key={step.id}
                className="flex items-start gap-2.5 border-border/50 p-4 sm:border-r sm:last:border-r-0"
              >
                {status === "done" ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--success)]" />
                ) : status === "current" ? (
                  <div className="h-5 w-5 shrink-0 rounded-full border-2 border-[var(--brand)] bg-[color-mix(in_srgb,var(--brand)_12%,transparent)]" />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-muted-foreground/40" />
                )}
                <div>
                  <p className="text-xs font-semibold">{step.label}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {step.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bento">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold  ">
              Compute ledger
            </h2>
            <p className="text-xs text-muted-foreground">
              Pays for 0G Compute inference fees
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refresh()}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        <div className="space-y-4 px-5 pb-5">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking ledger status…
            </div>
          ) : !ledgerExists ? (
            <div className="rounded-2xl bg-muted/40 px-6 py-8 text-center">
              <Wallet className="mx-auto mb-3 h-9 w-9 text-[var(--brand)]/70" />
              <p className="text-sm font-medium">No compute ledger yet</p>
              <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                Creating a ledger locks {MIN_LEDGER_CREATE_OG} OG from the
                broker wallet
                {broker
                  ? ` (${formatOG(broker.nativeBalanceOg)} OG available)`
                  : ""}
                {shortfall > 0
                  ? ` — short by ${formatOG(shortfall)} OG.`
                  : "."}
              </p>
              <Button
                className="mt-4 gap-2"
                onClick={() => createLedger(MIN_LEDGER_CREATE_OG)}
                disabled={
                  actionLoading === "create" || (!canCreate && !!broker)
                }
              >
                {actionLoading === "create" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PlusCircle className="h-4 w-4" />
                )}
                Create ledger ({MIN_LEDGER_CREATE_OG} OG)
              </Button>
              {!canCreate && broker ? (
                <p className="mt-2 text-[11px] text-[var(--danger)]">
                  Need {formatOG(shortfall)} more OG on the broker wallet first
                </p>
              ) : null}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: "Total",
                    value: formatOG(totalOG),
                    color: "text-foreground",
                  },
                  {
                    label: "Locked",
                    value: formatOG(ledger ? Number(ledger.locked) / 1e18 : 0),
                    color: "text-amber-600",
                  },
                  {
                    label: "Available",
                    value: formatOG(availableOG),
                    color: "text-[var(--success)]",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl bg-muted/40 p-3 text-center"
                  >
                    <p className="text-[10px]     text-muted-foreground">
                      {item.label}
                    </p>
                    <p className={cn("mt-1 text-lg font-semibold", item.color)}>
                      {item.value} OG
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="rounded-full sm:max-w-[120px]"
                  placeholder="Amount"
                />
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => deposit(parseFloat(depositAmount) || 0.1)}
                  disabled={actionLoading === "deposit"}
                >
                  {actionLoading === "deposit" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowDownToLine className="h-4 w-4" />
                  )}
                  Deposit OG
                </Button>
                {[1, 3, 5].map((amt) => (
                  <Button
                    key={amt}
                    variant="ghost"
                    size="sm"
                    onClick={() => deposit(amt)}
                    disabled={actionLoading === "deposit"}
                  >
                    +{amt} OG
                  </Button>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {ledgerExists && (
        <section className="bento">
          <div className="px-5 py-4">
            <h2 className="text-sm font-semibold  ">
              AI models on 0G Compute
            </h2>
            <p className="text-xs text-muted-foreground">
              Fund at least one provider to enable inference
            </p>
          </div>
          <div className="grid gap-3 px-5 pb-5 sm:grid-cols-2">
            {models.length === 0 ? (
              <p className="col-span-2 py-4 text-center text-sm text-muted-foreground">
                No models available — check server env keys
              </p>
            ) : (
              models.map((m) => (
                <ModelCard
                  key={`${m.provider}-${m.model}`}
                  model={m}
                  availableOG={availableOG}
                  funded={fundedProviders.has(m.provider)}
                  actionLoading={actionLoading}
                  onFund={fundProvider}
                />
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}
