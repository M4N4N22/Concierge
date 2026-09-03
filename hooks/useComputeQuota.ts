"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";

export type ComputeQuota = {
  used: number;
  limit: number;
  remaining: number;
  resetsAt: number | null;
};

export function useComputeQuota(enabled = true) {
  const { address, isConnected } = useAccount();
  const [quota, setQuota] = useState<ComputeQuota | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled || !isConnected || !address) {
      setQuota(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/compute/quota?wallet=${address}`);
      const data = await res.json();
      setQuota(data.quota ?? null);
    } catch {
      setQuota(null);
    } finally {
      setLoading(false);
    }
  }, [address, enabled, isConnected]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const pctRemaining =
    quota && quota.limit > 0 ? quota.remaining / quota.limit : null;
  const isLow =
    pctRemaining != null && pctRemaining > 0 && pctRemaining <= 0.15;
  const isExhausted = quota != null && quota.remaining <= 0;

  return {
    quota,
    loading,
    refresh,
    pctRemaining,
    isLow,
    isExhausted,
  };
}
