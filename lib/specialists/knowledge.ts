import type {
  KnowledgeFilter,
  SpecialistDefinition,
  VaultKnowledgeItem,
} from "@/lib/specialists/types";

function hasInsights(item: VaultKnowledgeItem): boolean {
  const cid = item.insightsCID?.trim();
  if (!cid) return false;
  // Zero hash = not fed yet
  if (/^0x0+$/i.test(cid)) return false;
  return true;
}

export function matchesKnowledgeFilter(
  item: VaultKnowledgeItem,
  filter: KnowledgeFilter
): boolean {
  if (filter.requireInsights && !hasInsights(item)) return false;
  const cat = (item.category || "").toLowerCase();
  if (!filter.categoryIncludes.length) return !filter.requireInsights || hasInsights(item);
  return filter.categoryIncludes.some((kw) => cat.includes(kw.toLowerCase()));
}

/** Filter vault knowledge for a specialist (Wave 4 Chat / recommendations). */
export function filterVaultForSpecialist<T extends VaultKnowledgeItem>(
  items: T[],
  specialist: SpecialistDefinition,
  options?: { limit?: number }
): T[] {
  const matched = items.filter((item) =>
    matchesKnowledgeFilter(item, specialist.knowledgeFilter)
  );
  const limit = options?.limit ?? 24;
  return matched.slice(0, limit);
}

export function specialistKnowledgeCoverage(
  items: VaultKnowledgeItem[],
  specialist: SpecialistDefinition
): { matched: number; total: number; ready: boolean } {
  const matched = filterVaultForSpecialist(items, specialist).length;
  return {
    matched,
    total: items.length,
    ready: matched > 0,
  };
}

/** Draft a custom specialist from a free-text craft (e.g. "copywriter") + vault categories. */
export function draftCustomSpecialist(args: {
  id: string;
  label: string;
  description: string;
  domain: SpecialistDefinition["domain"];
  linkedVaultCategories: string[];
  categoryIncludes: string[];
  systemPrompt: string;
}): SpecialistDefinition {
  return {
    schemaVersion: "concierge.specialist.v1",
    id: args.id.trim().toLowerCase().replace(/\s+/g, "-").slice(0, 64),
    label: args.label.trim().slice(0, 48),
    description: args.description.trim().slice(0, 160),
    domain: args.domain,
    linkedVaultCategories: args.linkedVaultCategories.slice(0, 8),
    knowledgeFilter: {
      categoryIncludes: args.categoryIncludes.map((k) => k.toLowerCase()).slice(0, 16),
      requireInsights: true,
    },
    systemPrompt: args.systemPrompt.trim().slice(0, 2_000),
    status: "experimental",
  };
}
