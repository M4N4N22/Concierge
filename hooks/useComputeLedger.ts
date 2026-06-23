"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { MIN_LEDGER_CREATE_OG, MIN_PROVIDER_FUND_OG } from "@/lib/computeConstants";

export type ComputeModel = {
  provider: string;
  model: string;
  verifiability: string;
  minUnits: string;
  tags?: string[];
};

export type LedgerState = {
  total: bigint;
  locked: bigint;
  available: bigint;
};

const MODEL_TAGS: Record<string, string[]> = {
  "phala/deepseek-chat-v3-0324": ["Cheapest", "Fast"],
  "phala/gpt-oss-120b": ["High accuracy", "Text"],
  "phala/qwen2.5-vl-72b-instruct": ["Multimodal"],
  "openai/gpt-oss-120b": ["Reliable", "Large files"],
};

function tagModel(m: ComputeModel): ComputeModel {
  return { ...m, tags: MODEL_TAGS[m.model] };
}

export function ogFromWei(wei: bigint): number {
  return Number(wei) / 1e18;
}

export function formatOG(value: number): string {
  if (value >= 0.01) return value.toFixed(4);
  return value.toFixed(8).replace(/\.?0+$/, "");
}

export function useComputeLedger() {
  const [models, setModels] = useState<ComputeModel[]>([]);
  const [ledger, setLedger] = useState<LedgerState | null>(null);
  const [ledgerExists, setLedgerExists] = useState(false);
  const [fundedProviders, setFundedProviders] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const refreshLedger = useCallback(async () => {
    const res = await fetch("/api/ledger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "check" }),
    });
    const data = await res.json();
    if (data.exists && data.ledger) {
      const total = BigInt(data.ledger[1] ?? 0);
      const locked = BigInt(data.ledger[2] ?? 0);
      setLedger({ total, locked, available: total - locked });
      setLedgerExists(true);
    } else {
      setLedger(null);
      setLedgerExists(false);
    }
  }, []);

  const refreshModels = useCallback(async () => {
    const res = await fetch("/api/models");
    const data = await res.json();
    if (data.models) {
      setModels((data.models as ComputeModel[]).map(tagModel));
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([refreshModels(), refreshLedger()]);
    } finally {
      setLoading(false);
    }
  }, [refreshLedger, refreshModels]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createLedger = async (amount = MIN_LEDGER_CREATE_OG) => {
    setActionLoading("create");
    try {
      const res = await fetch("/api/ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create ledger");
      toast.success("0G Compute ledger created");
      await refreshLedger();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Ledger creation failed");
    } finally {
      setActionLoading(null);
    }
  };

  const deposit = async (amount: number) => {
    setActionLoading("deposit");
    try {
      const res = await fetch("/api/ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deposit", amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Deposit failed");
      toast.success(`Deposited ${amount} OG to ledger`);
      await refreshLedger();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Deposit failed");
    } finally {
      setActionLoading(null);
    }
  };

  const fundProvider = async (provider: string, amount: number) => {
    if (amount < MIN_PROVIDER_FUND_OG) {
      toast.error(`Minimum ${MIN_PROVIDER_FUND_OG} OG required to fund a provider`);
      return;
    }
    setActionLoading(`fund-${provider}`);
    try {
      const res = await fetch("/api/ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "fundSubAccount", subAccount: provider, amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Funding failed");
      setFundedProviders((prev) => new Set(prev).add(provider));
      toast.success("Provider account funded — ready for inference");
      await refreshLedger();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Provider funding failed");
    } finally {
      setActionLoading(null);
    }
  };

  const availableOG = ledger ? ogFromWei(ledger.available) : 0;
  const totalOG = ledger ? ogFromWei(ledger.total) : 0;

  const readiness = useMemo(() => {
    const hasLedger = ledgerExists;
    const hasBalance = totalOG > 0;
    const hasFundedProvider = fundedProviders.size > 0;
    const canCompute = hasLedger && hasBalance && hasFundedProvider;
    return { hasLedger, hasBalance, hasFundedProvider, canCompute };
  }, [ledgerExists, totalOG, fundedProviders.size]);

  return {
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
  };
}
