const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export type ChatTipsPayload = {
  summary: string;
  questions: Array<{
    title: string;
    description: string;
    prompt: string;
  }>;
};

export type TipsInferenceSource = "inference" | "cached" | "static";

type WalletSlot = {
  used: number;
  resetAt: number;
  payload: ChatTipsPayload | null;
};

type IpSlot = { used: number; resetAt: number };

const walletSlots = new Map<string, WalletSlot>();
const ipSlots = new Map<string, IpSlot>();
const inflight = new Map<string, Promise<ChatTipsPayload | null>>();

export function getTipsWeeklyLimit(): number {
  const n = Number(process.env.COMPUTE_FREE_TIPS_WEEKLY_LIMIT ?? 1);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
}

function getTipsIpWeeklyLimit(): number {
  return Math.max(getTipsWeeklyLimit() * 3, 3);
}

function walletKey(wallet: string): string {
  return wallet.toLowerCase();
}

function weekFrom(now: number): number {
  return now + WEEK_MS;
}

function getWalletSlot(wallet: string, now: number): WalletSlot {
  const key = walletKey(wallet);
  let slot = walletSlots.get(key);
  if (!slot || now >= slot.resetAt) {
    slot = { used: 0, resetAt: weekFrom(now), payload: null };
    walletSlots.set(key, slot);
  }
  return slot;
}

function tryConsumeIp(ip: string, now: number): boolean {
  const limit = getTipsIpWeeklyLimit();
  let slot = ipSlots.get(ip);
  if (!slot || now >= slot.resetAt) {
    slot = { used: 0, resetAt: weekFrom(now) };
    ipSlots.set(ip, slot);
  }
  if (slot.used >= limit) return false;
  slot.used += 1;
  return true;
}

function refundIp(ip: string): void {
  const slot = ipSlots.get(ip);
  if (slot && slot.used > 0) slot.used -= 1;
}

/**
 * At most one (configurable) Router call per wallet per week.
 * Replays the last successful payload. Failed inference refunds the slot.
 */
export async function withTipsWeeklyInference(
  wallet: string,
  ip: string,
  run: () => Promise<ChatTipsPayload>
): Promise<{
  source: TipsInferenceSource;
  payload: ChatTipsPayload | null;
  resetsAt: number;
}> {
  const key = walletKey(wallet);
  const now = Date.now();
  const slot = getWalletSlot(key, now);
  const limit = getTipsWeeklyLimit();

  if (slot.payload?.questions.length) {
    return { source: "cached", payload: slot.payload, resetsAt: slot.resetAt };
  }
  if (slot.used >= limit) {
    return { source: "static", payload: null, resetsAt: slot.resetAt };
  }

  const pending = inflight.get(key);
  if (pending) {
    const payload = await pending;
    const current = getWalletSlot(key, Date.now());
    return {
      source: payload ? "cached" : "static",
      payload,
      resetsAt: current.resetAt,
    };
  }

  let settle!: (value: ChatTipsPayload | null) => void;
  const gate = new Promise<ChatTipsPayload | null>((resolve) => {
    settle = resolve;
  });
  inflight.set(key, gate);

  try {
    if (!tryConsumeIp(ip, Date.now())) {
      settle(null);
      return { source: "static", payload: null, resetsAt: slot.resetAt };
    }

    slot.used += 1;
    const payload = await run();
    if (!payload.questions.length) {
      throw new Error("Empty tips payload");
    }

    const current = getWalletSlot(key, Date.now());
    current.payload = payload;
    settle(payload);
    return { source: "inference", payload, resetsAt: current.resetAt };
  } catch (err) {
    const current = getWalletSlot(key, Date.now());
    if (current.used > 0) current.used -= 1;
    refundIp(ip);
    settle(null);
    console.warn("[chatTips] inference unavailable, using static fallback:", err);
    return { source: "static", payload: null, resetsAt: current.resetAt };
  } finally {
    inflight.delete(key);
  }
}
