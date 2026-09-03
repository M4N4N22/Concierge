import type { AccessPass } from "@/lib/lendAccess/types";
import { ACCESS_PASS_SCHEMA } from "@/lib/lendAccess/types";

const DAY = 86_400;

/** Draft a timed access pass — not activated until Wave 4 marketplace wiring. */
export function draftAccessPass(args: {
  ownerTokenId?: string | null;
  guestWallet?: string | null;
  shareSliceId: string;
  durationDays?: number;
  nowSec?: number;
}): AccessPass {
  const now = args.nowSec ?? Math.floor(Date.now() / 1000);
  const days = Math.max(1, args.durationDays ?? 7);
  return {
    schemaVersion: ACCESS_PASS_SCHEMA,
    id: `pass-${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    ownerTokenId: args.ownerTokenId ?? null,
    guestWallet: args.guestWallet ?? null,
    shareSliceId: args.shareSliceId,
    startsAt: now,
    endsAt: now + days * DAY,
    status: "draft",
  };
}

export function isPassActive(
  pass: AccessPass,
  nowSec = Math.floor(Date.now() / 1000)
): boolean {
  if (pass.status !== "active") return false;
  return nowSec >= pass.startsAt && nowSec < pass.endsAt;
}

export function revokePass(pass: AccessPass): AccessPass {
  return { ...pass, status: "revoked" };
}

export function expirePassIfNeeded(
  pass: AccessPass,
  nowSec = Math.floor(Date.now() / 1000)
): AccessPass {
  if (pass.status === "active" && nowSec >= pass.endsAt) {
    return { ...pass, status: "expired" };
  }
  return pass;
}
