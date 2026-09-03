"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useChainId } from "wagmi";
import { toast } from "sonner";
import { MIN_LEDGER_CREATE_OG, MIN_PROVIDER_FUND_OG } from "@/lib/computeConstants";
import { cachedJson, invalidateComputeClientCache } from "@/lib/cachedJson";
import {
  COMPUTE_CACHE_TTL,
  computeStatusCacheKey,
  ledgerCheckCacheKey,
  modelsCacheKey,
} from "@/lib/computeCacheKeys";

export type ComputeModel = {
  provider: string;
  model: string;
  verifiability: string;
  minUnits: string;
  tags?: string[];
};

export type OperatorComputeStatus = {
  backend: "router" | "direct" | "none";
  subsidized: boolean;
  operatorReady: boolean;
  routerConfigured: boolean;
  directConfigured: boolean;
  freeTierChatWeeklyLimit: number;
  freeTierFeedWeeklyLimit: number;
  routerModel?: string;
  privateComputerUrl: string;
  copy?: string;
};

export type ComputeReadiness = {
  hasLedger: boolean;
  hasBalance: boolean;
  hasFundedProvider: boolean;
  canCompute: boolean;
  operatorSubsidized: boolean;
  operatorReady: boolean;
  backend: "router" | "direct" | "none";
  freeTierChatWeeklyLimit: number;
  freeTierFeedWeeklyLimit: number;
};

export type LedgerState = {
  total: bigint;
  locked: bigint;
  available: bigint;
};

export type BrokerWalletInfo = {
  address: string;
  chainId: number;
  network: string;
  isTestnet: boolean;
  nativeBalanceOg: number;
  requiredCreateOg: number;
  shortfallOg: number;
  canCreateLedger: boolean;
};

const MODEL_TAGS: Record<string, string[]> = {
  "glm-5.3-flash": ["Cheapest", "Fast"],
  "deepseek-v4-flash": ["Fast", "Long context"],
  "qwen3.8-flash": ["Fast", "Multimodal"],
  "glm-5.2": ["High accuracy"],
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
  const chainId = useChainId();
  const [models, setModels] = useState<ComputeModel[]>([]);
  const [ledger, setLedger] = useState<LedgerState | null>(null);
  const [ledgerExists, setLedgerExists] = useState(false);
  const [broker, setBroker] = useState<BrokerWalletInfo | null>(null);
  const [fundedProviders, setFundedProviders] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [operator, setOperator] = useState<OperatorComputeStatus | null>(null);

  const refreshOperator = useCallback(async () => {
    try {
      const data = await cachedJson<OperatorComputeStatus>(
        computeStatusCacheKey(),
        "/api/compute/status",
        { ttlMs: COMPUTE_CACHE_TTL.status }
      );
      setOperator(data);
      return data;
    } catch {
      setOperator(null);
      return null;
    }
  }, []);

  const refreshLedger = useCallback(
    async (bypass = false) => {
      try {
        const data = await cachedJson<{
          exists?: boolean;
          ledger?: unknown[];
          broker?: BrokerWalletInfo;
        }>(ledgerCheckCacheKey(chainId), "/api/ledger", {
          ttlMs: COMPUTE_CACHE_TTL.ledgerCheck,
          method: "POST",
          body: { action: "check", chainId },
          bypass,
        });
        setBroker(data.broker ? (data.broker as BrokerWalletInfo) : null);
        if (data.exists && data.ledger) {
          const total = BigInt(data.ledger[1] ?? 0);
          const locked = BigInt(data.ledger[2] ?? 0);
          setLedger({ total, locked, available: total - locked });
          setLedgerExists(true);
        } else {
          setLedger(null);
          setLedgerExists(false);
        }
      } catch {
        setBroker(null);
        setLedger(null);
        setLedgerExists(false);
      }
    },
    [chainId]
  );

  const refreshModels = useCallback(
    async (bypass = false) => {
      try {
        const data = await cachedJson<{ models?: ComputeModel[] }>(
          modelsCacheKey(chainId),
          `/api/models?chainId=${chainId}`,
          { ttlMs: COMPUTE_CACHE_TTL.modelsBroker, bypass }
        );
        setModels(data.models ? data.models.map(tagModel) : []);
      } catch {
        setModels([]);
      }
    },
    [chainId]
  );

  const refreshLedgerData = useCallback(
    async (bypass = false) => {
      setLedgerLoading(true);
      try {
        await Promise.all([refreshModels(bypass), refreshLedger(bypass)]);
      } finally {
        setLedgerLoading(false);
      }
    },
    [refreshLedger, refreshModels]
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      invalidateComputeClientCache("compute:");
      const op = await refreshOperator();
      const skipByo = Boolean(op?.subsidized && op?.operatorReady);
      if (!skipByo) {
        await refreshLedgerData(true);
      }
    } finally {
      setLoading(false);
    }
  }, [refreshLedgerData, refreshOperator]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const op = await refreshOperator();
        if (cancelled) return;
        const skipByo = Boolean(op?.subsidized && op?.operatorReady);
        if (!skipByo) {
          await refreshLedgerData();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chainId, refreshLedgerData, refreshOperator]);

  const createLedger = async (amount = MIN_LEDGER_CREATE_OG) => {
    setActionLoading("create");
    try {
      const res = await fetch("/api/ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", amount, chainId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create ledger");
      toast.success("0G Compute ledger created");
      invalidateComputeClientCache("compute:ledger:");
      await refreshLedger(true);
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
        body: JSON.stringify({ action: "deposit", amount, chainId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Deposit failed");
      toast.success(`Deposited ${amount} OG to ledger`);
      invalidateComputeClientCache("compute:ledger:");
      await refreshLedger(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Deposit failed");
    } finally {
      setActionLoading(null);
    }
  };

  const fundProvider = async (provider: string, amount: number) => {
    if (amount < MIN_PROVIDER_FUND_OG) {
      toast.error(
        `Minimum ${MIN_PROVIDER_FUND_OG} OG required to fund a provider`
      );
      return;
    }
    setActionLoading(`fund-${provider}`);
    try {
      const res = await fetch("/api/ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "fundSubAccount",
          subAccount: provider,
          amount,
          chainId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Funding failed");
      setFundedProviders((prev) => new Set(prev).add(provider));
      toast.success("Provider account funded — ready for inference");
      invalidateComputeClientCache("compute:ledger:");
      await refreshLedger(true);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Provider funding failed"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const availableOG = ledger ? ogFromWei(ledger.available) : 0;
  const totalOG = ledger ? ogFromWei(ledger.total) : 0;

  const readiness = useMemo((): ComputeReadiness => {
    const hasLedger = ledgerExists;
    const hasBalance = totalOG > 0;
    const hasFundedProvider = fundedProviders.size > 0;
    const directReady = hasLedger && hasBalance && hasFundedProvider;
    const operatorReady = operator?.operatorReady ?? false;
    const operatorSubsidized = operator?.subsidized ?? false;
    const canCompute =
      operatorSubsidized && operatorReady ? true : directReady;

    return {
      hasLedger,
      hasBalance,
      hasFundedProvider,
      canCompute,
      operatorSubsidized,
      operatorReady,
      backend: operator?.backend ?? "none",
      freeTierChatWeeklyLimit: operator?.freeTierChatWeeklyLimit ?? 10,
      freeTierFeedWeeklyLimit: operator?.freeTierFeedWeeklyLimit ?? 10,
    };
  }, [
    ledgerExists,
    totalOG,
    fundedProviders.size,
    operator,
  ]);

  return {
    models,
    ledger,
    ledgerExists,
    broker,
    fundedProviders,
    loading,
    ledgerLoading,
    actionLoading,
    availableOG,
    totalOG,
    readiness,
    operator,
    refresh,
    createLedger,
    deposit,
    fundProvider,
    chainId,
  };
}
