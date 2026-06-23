export type AgentDomain = "finance" | "travel" | "subscription";

export const AGENT_DOMAINS: AgentDomain[] = ["finance", "travel", "subscription"];

const DOMAIN_KEYWORDS: Record<AgentDomain, string[]> = {
  finance: ["finance", "financial", "medical", "bill", "spending", "payment", "invoice", "bank", "tax"],
  travel: ["travel", "flight", "trip", "hotel", "airline", "booking", "itinerary"],
  subscription: ["subscription", "recurring", "streaming", "saas", "membership", "renewal"],
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
    title: "Finance Agent",
    description: "Analyzes spending patterns and offers optimization insights from your vault.",
  },
  travel: {
    title: "Travel Agent",
    description: "Learns from your past trips to personalize future travel advice.",
  },
  subscription: {
    title: "Subscription Agent",
    description: "Tracks recurring payments and suggests smart cancellations or alternatives.",
  },
};
