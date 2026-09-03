import { getDailyComputeLimit } from "@/lib/computeOperator";

const DAY_MS = 24 * 60 * 60 * 1000;

type Bucket = { count: number; resetAt: number };

const walletDaily = new Map<string, Bucket>();

function normalizeWallet(wallet: string): string {
  return wallet.toLowerCase();
}

export function peekWalletDailyQuota(wallet: string): {
  used: number;
  limit: number;
  remaining: number;
  resetsAt: number | null;
} {
  const limit = getDailyComputeLimit();
  const key = normalizeWallet(wallet);
  const now = Date.now();
  const cur = walletDaily.get(key);

  if (!cur || now >= cur.resetAt) {
    return { used: 0, limit, remaining: limit, resetsAt: null };
  }

  return {
    used: cur.count,
    limit,
    remaining: Math.max(0, limit - cur.count),
    resetsAt: cur.resetAt,
  };
}

export function checkAndConsumeWalletDailyQuota(wallet: string):
  | { ok: true; remaining: number; limit: number }
  | { ok: false; retryAfterMs: number; limit: number; used: number } {
  const limit = getDailyComputeLimit();
  const key = normalizeWallet(wallet);
  const now = Date.now();
  let cur = walletDaily.get(key);

  if (!cur || now >= cur.resetAt) {
    cur = { count: 0, resetAt: now + DAY_MS };
    walletDaily.set(key, cur);
  }

  if (cur.count >= limit) {
    return {
      ok: false,
      retryAfterMs: cur.resetAt - now,
      limit,
      used: cur.count,
    };
  }

  cur.count += 1;
  return { ok: true, remaining: limit - cur.count, limit };
}
