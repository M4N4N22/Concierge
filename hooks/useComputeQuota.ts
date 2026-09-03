"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { cachedJson } from "@/lib/cachedJson";
import { COMPUTE_CACHE_TTL, quotaCacheKey } from "@/lib/computeCacheKeys";

export type ComputeQuota = {
  used: number;
  limit: number;
  remaining: number;
  resetsAt: number | null;
};

export type ComputeQuotas = {
  chat: ComputeQuota;
  feed: ComputeQuota;
};

export type ComputeQuotaKind = "chat" | "feed";

export function useComputeQuota(
  enabled = true,
  kind: ComputeQuotaKind = "chat"
) {
  const { address, isConnected } = useAccount();
  const [quotas, setQuotas] = useState<ComputeQuotas | null>(null);
  const [subsidized, setSubsidized] = useState(false);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled || !isConnected || !address) {
      setQuotas(null);
      setSubsidized(false);
      return;
    }
    setLoading(true);
    try {
      const data = await cachedJson<{
        quotas?: ComputeQuotas | null;
        subsidized?: boolean;
      }>(quotaCacheKey(address), `/api/compute/quota?wallet=${address}`, {
        ttlMs: COMPUTE_CACHE_TTL.quota,
      });
      setQuotas(data.quotas ?? null);
      setSubsidized(Boolean(data.subsidized));
    } catch {
      setQuotas(null);
      setSubsidized(false);
    } finally {
      setLoading(false);
    }
  }, [address, enabled, isConnected]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const quota = quotas?.[kind] ?? null;

  const pctRemaining =
    quota && quota.limit > 0 ? quota.remaining / quota.limit : null;
  const isLow =
    pctRemaining != null && pctRemaining > 0 && pctRemaining <= 0.15;
  const isExhausted = quota != null && quota.remaining <= 0;

  return {
    quota,
    quotas,
    subsidized,
    loading,
    refresh,
    pctRemaining,
    isLow,
    isExhausted,
  };
}
