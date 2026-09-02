export type AgentDomain = "finance" | "travel" | "subscription";

export const AGENT_DOMAINS: AgentDomain[] = ["finance", "travel", "subscription"];

const DOMAIN_KEYWORDS: Record<AgentDomain, string[]> = {
  finance: [
    "finance",
    "financial",
    "medical",
    "bill",
    "spending",
    "payment",
    "invoice",
    "bank",
    "tax",
    "evidence:spend",
    "evidence:wallet",
    "evidence:tx",
    "evidence:board",
    "evidence:briefing",
  ],
  travel: ["travel", "flight", "trip", "hotel", "airline", "booking", "itinerary", "evidence:travel"],
  subscription: [
    "subscription",
    "recurring",
    "streaming",
    "saas",
    "membership",
    "renewal",
    "evidence:subscription",
  ],
};

export function matchFileToDomain(category: string): AgentDomain | null {
  const lower = category.toLowerCase();
  for (const domain of AGENT_DOMAINS) {
    if (DOMAIN_KEYWORDS[domain].some((kw) => lower.includes(kw))) {
      return domain;
    }
  }
  return null;
}

export function domainProgress(files: { category: string }[], domain: AgentDomain): number {
  if (!files.length) return 0;
  const matched = files.filter((f) => matchFileToDomain(f.category) === domain).length;
  return Math.min(100, Math.round((matched / files.length) * 100) + (matched > 0 ? 20 : 0));
}

export const DOMAIN_META: Record<
  AgentDomain,
  { title: string; description: string }
> = {
  finance: {
    title: "Finance focus",
    description: "Ask about spending, bills, and wallet activity using matching vault files.",
  },
  travel: {
    title: "Travel focus",
    description: "Ask about trips and bookings using travel-related vault evidence.",
  },
  subscription: {
    title: "Subscriptions focus",
    description: "Ask about recurring payments and renewals using subscription evidence.",
  },
};
