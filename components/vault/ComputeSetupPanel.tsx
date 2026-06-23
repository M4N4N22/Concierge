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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useComputeLedgerContext } from "@/components/vault/ComputeLedgerContext";
import { formatOG, type ComputeModel } from "@/hooks/useComputeLedger";
import { MIN_LEDGER_CREATE_OG, MIN_PROVIDER_FUND_OG } from "@/lib/computeConstants";
import { useState } from "react";

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
        "rounded-xl border p-4 transition-colors",
        funded ? "border-green-500/30 bg-green-500/5" : "bg-card"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {model.tags && (
            <div className="flex flex-wrap gap-1 mb-2">
              {model.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <p className="text-sm font-semibold truncate">{model.model}</p>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
            {model.provider.slice(0, 10)}…{model.provider.slice(-6)}
          </p>
        </div>
        {funded ? (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
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
        <p className="mt-3 text-xs font-medium text-green-600 dark:text-green-400">
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
  } = useComputeLedgerContext();

  const [depositAmount, setDepositAmount] = useState("0.5");
  const completedSteps = SETUP_STEPS.filter(
    (s) => stepStatus(s.id, readiness) === "done"
  ).length;
  const progressPercent = Math.round((completedSteps / SETUP_STEPS.length) * 100);

  return (
    <div className="space-y-6">
      {/* Pipeline */}
      <section className="rounded-2xl border bg-card overflow-hidden">
        <div className="border-b bg-muted/30 px-5 py-3.5">
          <p className="text-sm font-medium">0G Compute setup</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Create a ledger, fund it, enable a model — then run AI on your vault
          </p>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Setup progress</span>
            <span className="font-medium">
              {completedSteps}/{SETUP_STEPS.length} steps
            </span>
          </div>
          <Progress value={progressPercent} className="h-1.5" />
        </div>

        <div className="grid sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border border-t">
          {SETUP_STEPS.map((step) => {
            const status = stepStatus(step.id, readiness);
            return (
              <div key={step.id} className="flex items-start gap-2.5 p-4">
                {status === "done" ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                ) : status === "current" ? (
                  <div className="h-5 w-5 shrink-0 rounded-full border-2 border-primary bg-primary/10" />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-muted-foreground/40" />
                )}
                <div>
                  <p className="text-xs font-semibold">{step.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{step.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Ledger controls */}
      <section className="rounded-2xl border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold">Compute ledger</h2>
            <p className="text-sm text-muted-foreground">
              Your account for paying 0G Compute inference fees
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

        <div className="p-5 space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking ledger status…
            </div>
          ) : !ledgerExists ? (
            <div className="rounded-xl border border-dashed bg-muted/20 px-6 py-8 text-center">
              <Wallet className="h-10 w-10 mx-auto text-primary/60 mb-3" />
              <p className="text-sm font-medium">No compute ledger yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Create a ledger on 0G Compute to pay for AI inference. The network
                requires a minimum deposit of {MIN_LEDGER_CREATE_OG} OG from the server
                wallet (contract rule, not a UI conversion).
              </p>
              <Button
                className="mt-4 gap-2"
                onClick={() => createLedger(MIN_LEDGER_CREATE_OG)}
                disabled={actionLoading === "create"}
              >
                {actionLoading === "create" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PlusCircle className="h-4 w-4" />
                )}
                Create ledger ({MIN_LEDGER_CREATE_OG} OG)
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Total", value: formatOG(totalOG), color: "text-foreground" },
                  {
                    label: "Locked",
                    value: formatOG(ledger ? Number(ledger.locked) / 1e18 : 0),
                    color: "text-amber-600",
                  },
                  {
                    label: "Available",
                    value: formatOG(availableOG),
                    color: "text-green-600 dark:text-green-400",
                  },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border bg-muted/20 p-3 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {item.label}
                    </p>
                    <p className={cn("text-lg font-semibold mt-1", item.color)}>
                      {item.value} OG
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="sm:max-w-[120px]"
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

      {/* Models */}
      {ledgerExists && (
        <section className="rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-5 py-4">
            <h2 className="text-lg font-semibold">AI models on 0G Compute</h2>
            <p className="text-sm text-muted-foreground">
              Fund at least one provider to enable inference on your vault files
            </p>
          </div>
          <div className="p-5 grid gap-3 sm:grid-cols-2">
            {models.length === 0 ? (
              <p className="text-sm text-muted-foreground col-span-2 py-4 text-center">
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