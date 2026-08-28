/** Schema-first vault evidence — agents consume packs, not raw blobs. */

export const EVIDENCE_SCHEMA_VERSION = 1 as const;

export type EvidenceType =
  | "spend"
  | "tx"
  | "wallet"
  | "travel"
  | "subscription"
  | "contract"
  | "briefing"
  | "document"
  | "board";

export type EvidenceSource =
  | "wallet"
  | "csv"
  | "paste"
  | "upload"
  | "sample";

export type EvidenceFact = {
  key: string;
  value: string | number | boolean | null;
  unit?: string;
  confidence?: number;
};

export type VaultEvidence = {
  schemaVersion: typeof EVIDENCE_SCHEMA_VERSION;
  id: string;
  type: EvidenceType;
  source: EvidenceSource;
  title: string;
  summary: string;
  facts: EvidenceFact[];
  rawExcerpt?: string;
  wallet?: string;
  chainId?: number;
  createdAt: string;
  confidence: number;
};

export function evidenceCategory(type: EvidenceType): string {
  return `evidence:${type}`;
}

export function isEvidenceCategory(category: string): boolean {
  return category.startsWith("evidence:");
}

export function evidenceTypeFromCategory(
  category: string
): EvidenceType | null {
  if (!isEvidenceCategory(category)) return null;
  const t = category.slice("evidence:".length);
  const allowed: EvidenceType[] = [
    "spend",
    "tx",
    "wallet",
    "travel",
    "subscription",
    "contract",
    "briefing",
    "document",
    "board",
  ];
  return (allowed as string[]).includes(t) ? (t as EvidenceType) : null;
}

export function createEvidenceId(prefix: string): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${rand}`;
}
