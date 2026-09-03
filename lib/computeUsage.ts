import {
  getChatWeeklyLimit,
  getFeedWeeklyLimit,
} from "@/lib/computeOperator";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export type ComputeQuotaKind = "chat" | "feed";

type Bucket = { count: number; resetAt: number };

type WalletBuckets = { chat: Bucket; feed: Bucket };

const walletWeekly = new Map<string, WalletBuckets>();

export type QuotaSnapshot = {
  used: number;
  limit: number;
  remaining: number;
  resetsAt: number | null;
};

function normalizeWallet(wallet: string): string {
  return wallet.toLowerCase();
}

function getLimit(kind: ComputeQuotaKind): number {
  return kind === "chat" ? getChatWeeklyLimit() : getFeedWeeklyLimit();
}

function freshBucket(now: number): Bucket {
  return { count: 0, resetAt: now + WEEK_MS };
}

function getOrCreateBuckets(key: string, now: number): WalletBuckets {
  let buckets = walletWeekly.get(key);
  if (!buckets) {
    buckets = { chat: freshBucket(now), feed: freshBucket(now) };
    walletWeekly.set(key, buckets);
  }
  return buckets;
}

function refreshBucketIfExpired(bucket: Bucket, now: number): void {
  if (now >= bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + WEEK_MS;
  }
}

export function peekWalletWeeklyQuota(
  wallet: string,
  kind: ComputeQuotaKind
): QuotaSnapshot {
  const limit = getLimit(kind);
  const key = normalizeWallet(wallet);
  const now = Date.now();
  const buckets = walletWeekly.get(key);
  const bucket = buckets?.[kind];

  if (!bucket || now >= bucket.resetAt) {
    return { used: 0, limit, remaining: limit, resetsAt: null };
  }

  return {
    used: bucket.count,
    limit,
    remaining: Math.max(0, limit - bucket.count),
    resetsAt: bucket.resetAt,
  };
}

export function peekWalletWeeklyQuotas(wallet: string): {
  chat: QuotaSnapshot;
  feed: QuotaSnapshot;
} {
  return {
    chat: peekWalletWeeklyQuota(wallet, "chat"),
    feed: peekWalletWeeklyQuota(wallet, "feed"),
  };
}

export function checkAndConsumeWalletWeeklyQuota(
  wallet: string,
  kind: ComputeQuotaKind
):
  | { ok: true; remaining: number; limit: number }
  | { ok: false; retryAfterMs: number; limit: number; used: number } {
  const limit = getLimit(kind);
  const key = normalizeWallet(wallet);
  const now = Date.now();
  const buckets = getOrCreateBuckets(key, now);
  const bucket = buckets[kind];

  refreshBucketIfExpired(bucket, now);

  if (bucket.count >= limit) {
    return {
      ok: false,
      retryAfterMs: bucket.resetAt - now,
      limit,
      used: bucket.count,
    };
  }

  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count, limit };
}

export function formatQuotaResetLabel(retryAfterMs: number): string {
  const days = Math.ceil(retryAfterMs / (24 * 60 * 60 * 1000));
  if (days > 1) return `~${days} days`;
  const hours = Math.ceil(retryAfterMs / (60 * 60 * 1000));
  return `~${hours}h`;
}
