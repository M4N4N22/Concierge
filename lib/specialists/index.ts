import {
  getCatalogSpecialist,
  listCatalogSpecialists,
  SPECIALIST_CATALOG,
} from "@/lib/specialists/catalog";
import {
  draftCustomSpecialist,
  filterVaultForSpecialist,
  matchesKnowledgeFilter,
  specialistKnowledgeCoverage,
} from "@/lib/specialists/knowledge";
import {
  buildSpecialistInferencePrompt,
  formatKnowledgeLines,
} from "@/lib/specialists/prompt";
import {
  emptySpecialistPack,
  isSpecialistDefinition,
  SPECIALIST_PACK_SCHEMA,
  SPECIALIST_SCHEMA,
  type KnowledgeFilter,
  type SpecialistDefinition,
  type SpecialistDomain,
  type UserSpecialistPack,
  type VaultKnowledgeItem,
} from "@/lib/specialists/types";

/** Resolve catalog or custom specialist from a pack. */
export function resolveSpecialist(
  id: string,
  pack?: UserSpecialistPack | null
): SpecialistDefinition | undefined {
  const custom = pack?.custom.find((s) => s.id === id);
  if (custom) return custom;
  return getCatalogSpecialist(id);
}

export function listAvailableSpecialists(
  pack?: UserSpecialistPack | null
): SpecialistDefinition[] {
  const byId = new Map<string, SpecialistDefinition>();
  for (const s of listCatalogSpecialists()) byId.set(s.id, s);
  for (const s of pack?.custom ?? []) byId.set(s.id, s);
  return [...byId.values()];
}

export {
  SPECIALIST_CATALOG,
  SPECIALIST_SCHEMA,
  SPECIALIST_PACK_SCHEMA,
  getCatalogSpecialist,
  listCatalogSpecialists,
  draftCustomSpecialist,
  filterVaultForSpecialist,
  matchesKnowledgeFilter,
  specialistKnowledgeCoverage,
  buildSpecialistInferencePrompt,
  formatKnowledgeLines,
  emptySpecialistPack,
  isSpecialistDefinition,
};

export type {
  KnowledgeFilter,
  SpecialistDefinition,
  SpecialistDomain,
  UserSpecialistPack,
  VaultKnowledgeItem,
};
