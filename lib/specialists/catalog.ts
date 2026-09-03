import type { SpecialistDefinition } from "@/lib/specialists/types";
import { SPECIALIST_SCHEMA } from "@/lib/specialists/types";

/**
 * Shipped specialist templates.
 * Copywriter / trader show the Wave 4+ product direction; finance/travel keep continuity with `lib/domains`.
 */
export const SPECIALIST_CATALOG: SpecialistDefinition[] = [
  {
    schemaVersion: SPECIALIST_SCHEMA,
    id: "finance-advisor",
    label: "Finance advisor",
    description:
      "Spending, bills, and wallet activity from finance-tagged knowledge.",
    domain: "finance",
    linkedVaultCategories: ["Finance", "Bills", "Wallet", "Tax"],
    knowledgeFilter: {
      categoryIncludes: [
        "finance",
        "financial",
        "bill",
        "spend",
        "invoice",
        "bank",
        "tax",
        "wallet",
        "payment",
      ],
      requireInsights: true,
    },
    systemPrompt: `You are Concierge's Finance advisor — grounded ONLY in the user's vault knowledge below.
Speak like a careful personal CFO: concrete, cite patterns from their files, never invent balances.
If evidence is thin, say what is missing and what to upload next.`,
    status: "catalog",
  },
  {
    schemaVersion: SPECIALIST_SCHEMA,
    id: "trade-strategist",
    label: "Trade strategist",
    description:
      "OG/USDC and desk assist using finance evidence + trade memory — pairs with Trading desk.",
    domain: "trading",
    linkedVaultCategories: ["Finance", "Wallet", "Trade", "Board"],
    knowledgeFilter: {
      categoryIncludes: [
        "finance",
        "wallet",
        "tx",
        "trade",
        "board",
        "briefing",
        "spend",
      ],
      requireInsights: false,
    },
    systemPrompt: `You are Concierge's Trade strategist on 0G.
Help the user reason about positions, risk, and strategy drafts using THEIR vault evidence and desk context.
Prefer Buy/Sell/Hold clarity with risk notes. Never claim to execute trades; you only assist.
If data is insufficient, ask for wallet evidence or past desk briefings.`,
    status: "catalog",
  },
  {
    schemaVersion: SPECIALIST_SCHEMA,
    id: "copywriter",
    label: "Copywriter",
    description:
      "Sounds like the user: drafts and edits using their writing samples in the knowledge base.",
    domain: "writing",
    linkedVaultCategories: ["Writing", "Copy", "Marketing", "Notes"],
    knowledgeFilter: {
      categoryIncludes: [
        "writ",
        "copy",
        "market",
        "blog",
        "content",
        "draft",
        "note",
        "brand",
        "voice",
      ],
      requireInsights: true,
    },
    systemPrompt: `You are the user's Copywriter specialist — trained on THEIR vault writing samples.
Mimic their tone, vocabulary, and structure from the knowledge below. Do not sound like a generic AI.
When samples are sparse, ask for more of their writing rather than inventing a voice.`,
    status: "catalog",
  },
  {
    schemaVersion: SPECIALIST_SCHEMA,
    id: "travel-planner",
    label: "Travel planner",
    description: "Trips and bookings from travel-tagged knowledge.",
    domain: "travel",
    linkedVaultCategories: ["Travel", "Flights", "Hotels"],
    knowledgeFilter: {
      categoryIncludes: [
        "travel",
        "flight",
        "trip",
        "hotel",
        "airline",
        "booking",
        "itinerary",
      ],
      requireInsights: true,
    },
    systemPrompt: `You are Concierge's Travel planner.
Use only the user's trip/booking knowledge below. Prefer practical next steps over generic travel tips.`,
    status: "catalog",
  },
  {
    schemaVersion: SPECIALIST_SCHEMA,
    id: "subscription-auditor",
    label: "Subscription auditor",
    description: "Recurring payments and renewals from subscription knowledge.",
    domain: "subscription",
    linkedVaultCategories: ["Subscriptions", "SaaS", "Memberships"],
    knowledgeFilter: {
      categoryIncludes: [
        "subscription",
        "recurring",
        "streaming",
        "saas",
        "membership",
        "renewal",
      ],
      requireInsights: true,
    },
    systemPrompt: `You are Concierge's Subscription auditor.
Find waste, renewals, and overlaps from the user's subscription knowledge. Be blunt and actionable.`,
    status: "catalog",
  },
];

export function getCatalogSpecialist(
  id: string
): SpecialistDefinition | undefined {
  return SPECIALIST_CATALOG.find((s) => s.id === id);
}

export function listCatalogSpecialists(options?: {
  includeExperimental?: boolean;
}): SpecialistDefinition[] {
  if (options?.includeExperimental) return [...SPECIALIST_CATALOG];
  return SPECIALIST_CATALOG.filter((s) => s.status === "catalog");
}
