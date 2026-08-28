import { NextRequest } from "next/server";
import { verifyMessage, type Address, isAddress } from "viem";
import { boardAuthMessage } from "@/lib/boardAuthMessage";

export { boardAuthMessage } from "@/lib/boardAuthMessage";

const MAX_QUESTION_CHARS = 2_000;
const MAX_EVIDENCE_PACKS = 20;
const MAX_FACTS_PER_PACK = 40;
const SIGNATURE_TTL_MS = 5 * 60 * 1000;
/** Live swarm / auto (may fall back to live) share the stricter wallet quota. */
const LIVE_OR_AUTO_LIMIT = 3;
const OTHER_MODE_LIMIT = 8;

type Bucket = { count: number; resetAt: number };

const ipBuckets = new Map<string, Bucket>();
const walletBuckets = new Map<string, Bucket>();

function hit(
  map: Map<string, Bucket>,
  key: string,
  limit: number,
  windowMs: number
) {
  const now = Date.now();
  const cur = map.get(key);
  if (!cur || now >= cur.resetAt) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true as const, remaining: limit - 1 };
  }
  if (cur.count >= limit) {
    return { ok: false as const, retryAfterMs: cur.resetAt - now };
  }
  cur.count += 1;
  return { ok: true as const, remaining: limit - cur.count };
}

export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "unknown";
}

export type BoardAuthOk = {
  ok: true;
  wallet: Address;
  mode: "auto" | "live" | "fast" | "fallback";
  question: string;
};

export type BoardAuthFail = {
  ok: false;
  status: number;
  error: string;
};

/** Verify wallet signature + enforce rate/size limits before compute. */
export async function authorizeBoardRequest(
  req: NextRequest,
  body: Record<string, unknown>
): Promise<BoardAuthOk | BoardAuthFail> {
  const ip = clientIp(req);
  const ipLimit = hit(ipBuckets, ip, 10, 60_000);
  if (!ipLimit.ok) {
    return {
      ok: false,
      status: 429,
      error: `Too many requests from this IP. Retry in ${Math.ceil(ipLimit.retryAfterMs / 1000)}s`,
    };
  }

  const walletRaw = typeof body.wallet === "string" ? body.wallet : "";
  const signature = typeof body.signature === "string" ? body.signature : "";
  const timestamp =
    typeof body.timestamp === "number"
      ? body.timestamp
      : Number(body.timestamp);

  if (!isAddress(walletRaw)) {
    return { ok: false, status: 401, error: "Valid wallet address required" };
  }
  if (!signature || !Number.isFinite(timestamp)) {
    return {
      ok: false,
      status: 401,
      error: "Signed board authorization required (wallet signature + timestamp)",
    };
  }

  const now = Date.now();
  if (Math.abs(now - timestamp) > SIGNATURE_TTL_MS) {
    return { ok: false, status: 401, error: "Signature timestamp expired" };
  }

  const question = typeof body.question === "string" ? body.question : "";
  if (question.length > MAX_QUESTION_CHARS) {
    return {
      ok: false,
      status: 413,
      error: `Question exceeds ${MAX_QUESTION_CHARS} characters`,
    };
  }

  const evidence = Array.isArray(body.evidence) ? body.evidence : [];
  if (evidence.length > MAX_EVIDENCE_PACKS) {
    return {
      ok: false,
      status: 413,
      error: `At most ${MAX_EVIDENCE_PACKS} evidence packs allowed`,
    };
  }
  for (const item of evidence) {
    if (
      item &&
      typeof item === "object" &&
      Array.isArray((item as { facts?: unknown }).facts) &&
      (item as { facts: unknown[] }).facts.length > MAX_FACTS_PER_PACK
    ) {
      return {
        ok: false,
        status: 413,
        error: `Each evidence pack may have at most ${MAX_FACTS_PER_PACK} facts`,
      };
    }
  }

  const modeRaw = typeof body.mode === "string" ? body.mode : "auto";
  const mode =
    modeRaw === "live" ||
    modeRaw === "fast" ||
    modeRaw === "fallback" ||
    modeRaw === "auto"
      ? modeRaw
      : null;
  if (!mode) {
    return { ok: false, status: 400, error: "Invalid mode" };
  }

  const message = boardAuthMessage({
    wallet: walletRaw,
    timestamp,
    question,
  });

  let valid = false;
  try {
    valid = await verifyMessage({
      address: walletRaw as Address,
      message,
      signature: signature as `0x${string}`,
    });
  } catch {
    valid = false;
  }

  if (!valid) {
    return { ok: false, status: 401, error: "Invalid wallet signature" };
  }

  // Quota only after a valid signature — prevents unauth wallet DoS
  // auto can fall back to live swarm, so use the stricter live limit
  const walletKey = walletRaw.toLowerCase();
  const walletCap =
    mode === "live" || mode === "auto" ? LIVE_OR_AUTO_LIMIT : OTHER_MODE_LIMIT;
  const walletLimit = hit(walletBuckets, walletKey, walletCap, 60_000);
  if (!walletLimit.ok) {
    return {
      ok: false,
      status: 429,
      error: `Wallet rate limit exceeded. Retry in ${Math.ceil(walletLimit.retryAfterMs / 1000)}s`,
    };
  }

  return {
    ok: true,
    wallet: walletRaw as Address,
    mode,
    question,
  };
}
