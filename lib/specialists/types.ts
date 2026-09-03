/**
 * Specialist agents — soft personas under one Agentic ID (1 NFT / wallet).
 * Wave 3 lays the data model; Wave 4+ activates UX + custom specialists from knowledge.
 */

import type { AgentDomain } from "@/lib/domains";

export const SPECIALIST_SCHEMA = "concierge.specialist.v1" as const;
export const SPECIALIST_PACK_SCHEMA = "concierge.specialistPack.v1" as const;

/** Broader than vault focus chips — includes writing / trading specialists. */
export type SpecialistDomain = AgentDomain | "writing" | "trading" | "general";

export type KnowledgeFilter = {
  /** Match vault `category` if it includes any of these (case-insensitive). */
  categoryIncludes: string[];
  /** When true, only files with a non-empty insightsCID are used. */
  requireInsights?: boolean;
};

/**
 * Catalog or user-defined specialist.
 * Does **not** mint a second NFT — attaches to the owner's Agentic ID at runtime.
 */
export type SpecialistDefinition = {
  schemaVersion: typeof SPECIALIST_SCHEMA;
  id: string;
  label: string;
  description: string;
  domain: SpecialistDomain;
  /** Human-facing vault category labels this specialist prefers. */
  linkedVaultCategories: string[];
  knowledgeFilter: KnowledgeFilter;
  /** Injected as the specialist system / role prompt for 0G Compute. */
  systemPrompt: string;
  /** `catalog` = shipped templates; `experimental` = Wave 4+ surface. */
  status: "catalog" | "experimental";
};

/** Off-chain pack keyed to an Agentic ID — ready for localStorage / 0G Storage. */
export type UserSpecialistPack = {
  schemaVersion: typeof SPECIALIST_PACK_SCHEMA;
  /** On-chain token id as decimal string when known. */
  ownerTokenId: string | null;
  /** Active soft persona for Chat / recommendations. */
  activeSpecialistId: string | null;
  /** Enabled catalog + custom specialist ids. */
  enabledIds: string[];
  /** User-authored specialists (copywriter-from-my-vault, etc.). */
  custom: SpecialistDefinition[];
  updatedAt: string;
};

export type VaultKnowledgeItem = {
  category: string;
  summary?: string;
  insightsCID?: string;
  label?: string;
};

export function emptySpecialistPack(
  ownerTokenId: string | null = null
): UserSpecialistPack {
  return {
    schemaVersion: SPECIALIST_PACK_SCHEMA,
    ownerTokenId,
    activeSpecialistId: null,
    enabledIds: [],
    custom: [],
    updatedAt: new Date().toISOString(),
  };
}

export function isSpecialistDefinition(x: unknown): x is SpecialistDefinition {
  if (!x || typeof x !== "object") return false;
  const s = x as SpecialistDefinition;
  return (
    s.schemaVersion === SPECIALIST_SCHEMA &&
    typeof s.id === "string" &&
    typeof s.label === "string" &&
    typeof s.systemPrompt === "string" &&
    Array.isArray(s.linkedVaultCategories) &&
    !!s.knowledgeFilter &&
    Array.isArray(s.knowledgeFilter.categoryIncludes)
  );
}
