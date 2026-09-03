/** Shared TTLs for compute-related API reads (ms). */
export const COMPUTE_CACHE_TTL = {
  status: 60_000,
  modelsBroker: 120_000,
  modelsCatalog: 10 * 60_000,
  ledgerCheck: 30_000,
  quota: 15_000,
} as const;

export function modelsCacheKey(chainId: number | string | undefined): string {
  return `compute:models:${chainId ?? "default"}`;
}

export function ledgerCheckCacheKey(
  chainId: number | string | undefined
): string {
  return `compute:ledger:check:${chainId ?? "default"}`;
}

export function computeStatusCacheKey(): string {
  return "compute:status";
}

export function computeCatalogCacheKey(): string {
  return "compute:catalog:v2";
}

export function quotaCacheKey(wallet: string): string {
  return `compute:quota:${wallet.toLowerCase()}`;
}
