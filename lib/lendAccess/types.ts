/**
 * Lend access — Wave 4+ foundation.
 * Let someone use your Concierge for a while without handing over private files.
 * Full marketplace / chat wiring comes later; this is the data model only.
 */

export const SHARE_SLICE_SCHEMA = "concierge.shareSlice.v1" as const;
export const ACCESS_PASS_SCHEMA = "concierge.accessPass.v1" as const;
export const USE_HISTORY_SCHEMA = "concierge.useHistory.v1" as const;

/** What a guest is allowed to ask about — summaries only, not raw uploads. */
export type ShareSlice = {
  schemaVersion: typeof SHARE_SLICE_SCHEMA;
  id: string;
  label: string;
  description: string;
  /** Category keywords that map into this shareable slice. */
  categoryIncludes: string[];
  /** When true, only files that already have knowledge summaries are included. */
  requireKnowledge: boolean;
  /** false = safe to lend; true = keep for owner only. */
  ownerOnly: boolean;
};

/** Timed permission for another wallet to use the Concierge through a slice. */
export type AccessPass = {
  schemaVersion: typeof ACCESS_PASS_SCHEMA;
  id: string;
  /** Owner Agentic ID token (decimal string) when known. */
  ownerTokenId: string | null;
  /** Wallet that may use the Concierge under this pass. */
  guestWallet: string | null;
  shareSliceId: string;
  /** Unix seconds. */
  startsAt: number;
  /** Unix seconds. */
  endsAt: number;
  status: "draft" | "active" | "expired" | "revoked";
};

/** One recorded use — helps the Concierge show real history over time. */
export type UseMark = {
  id: string;
  kind: "chat" | "knowledge" | "lend" | "trade-assist";
  /** Storage root hash / CID when persisted. */
  proofRef: string | null;
  createdAt: number;
  note: string;
};

export type UseHistory = {
  schemaVersion: typeof USE_HISTORY_SCHEMA;
  ownerTokenId: string | null;
  marks: UseMark[];
};

export type VaultShareItem = {
  id: string;
  name: string;
  category: string;
  hasKnowledge: boolean;
};

export function emptyUseHistory(ownerTokenId: string | null = null): UseHistory {
  return {
    schemaVersion: USE_HISTORY_SCHEMA,
    ownerTokenId,
    marks: [],
  };
}
