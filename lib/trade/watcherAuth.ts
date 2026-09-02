import { NextRequest } from "next/server";
import { verifyMessage, type Address, isAddress } from "viem";
import { authorizeBoardRequest, type BoardAuthOk, type BoardAuthFail } from "@/lib/boardAuth";
import { TRADE_SUGGEST_QUESTION } from "./suggest";

export const WATCHER_MAX_TTL_MS = 24 * 60 * 60 * 1000;

export function watcherAuthMessage(input: {
  wallet: string;
  issuedAt: number;
  expiresAt: number;
}): string {
  return [
    "Concierge Portfolio Watcher",
    `Wallet: ${input.wallet.toLowerCase()}`,
    `Issued: ${input.issuedAt}`,
    `Expires: ${input.expiresAt}`,
    "Scope: trade-orchestrate",
  ].join("\n");
}

export type WatcherSession = {
  wallet: string;
  issuedAt: number;
  expiresAt: number;
  signature: `0x${string}`;
};

export function loadWatcherSession(): WatcherSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem("concierge.watcherSession.v1");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WatcherSession;
    if (
      parsed?.wallet &&
      parsed.signature &&
      Number.isFinite(parsed.issuedAt) &&
      Number.isFinite(parsed.expiresAt) &&
      parsed.expiresAt > Date.now()
    ) {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function saveWatcherSession(session: WatcherSession) {
  sessionStorage.setItem(
    "concierge.watcherSession.v1",
    JSON.stringify(session)
  );
}

export function clearWatcherSession() {
  sessionStorage.removeItem("concierge.watcherSession.v1");
}

export function isWatcherSessionValid(
  session: WatcherSession | null,
  wallet?: string
): boolean {
  if (!session) return false;
  if (wallet && session.wallet.toLowerCase() !== wallet.toLowerCase()) {
    return false;
  }
  return session.expiresAt > Date.now();
}

/** Board signature (5 min) or portfolio watcher signature (up to 24h). */
export async function authorizeTradeRequest(
  req: NextRequest,
  body: Record<string, unknown>
): Promise<BoardAuthOk | BoardAuthFail> {
  const useWatcher = body.watcherAuth === true;
  if (!useWatcher) {
    body.question = TRADE_SUGGEST_QUESTION;
    return authorizeBoardRequest(req, body);
  }

  const walletRaw = typeof body.wallet === "string" ? body.wallet : "";
  const signature = typeof body.signature === "string" ? body.signature : "";
  const issuedAt =
    typeof body.issuedAt === "number"
      ? body.issuedAt
      : Number(body.issuedAt);
  const expiresAt =
    typeof body.expiresAt === "number"
      ? body.expiresAt
      : Number(body.expiresAt);

  if (!isAddress(walletRaw)) {
    return { ok: false, status: 401, error: "Valid wallet address required" };
  }
  if (!signature || !Number.isFinite(issuedAt) || !Number.isFinite(expiresAt)) {
    return {
      ok: false,
      status: 401,
      error: "Watcher authorization requires signature, issuedAt, and expiresAt",
    };
  }

  const now = Date.now();
  if (expiresAt <= now) {
    return { ok: false, status: 401, error: "Watcher authorization expired" };
  }
  if (issuedAt > now + 60_000) {
    return { ok: false, status: 401, error: "Watcher issuedAt is in the future" };
  }
  if (expiresAt - issuedAt > WATCHER_MAX_TTL_MS) {
    return {
      ok: false,
      status: 401,
      error: "Watcher authorization TTL exceeds 24 hours",
    };
  }

  const message = watcherAuthMessage({
    wallet: walletRaw,
    issuedAt,
    expiresAt,
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
    return { ok: false, status: 401, error: "Invalid watcher signature" };
  }

  const modeRaw = typeof body.mode === "string" ? body.mode : "fast";
  const mode =
    modeRaw === "live" ||
    modeRaw === "fast" ||
    modeRaw === "fallback" ||
    modeRaw === "auto"
      ? modeRaw
      : "fast";

  return {
    ok: true,
    wallet: walletRaw as Address,
    mode,
    question: TRADE_SUGGEST_QUESTION,
  };
}
