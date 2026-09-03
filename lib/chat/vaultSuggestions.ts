import type { LucideIcon } from "lucide-react";
import { Lightbulb, Sparkles, Upload } from "lucide-react";
import type { VaultFile } from "@/hooks/useUserFiles";
import {
  isAgentKnowledge,
  isStoredOnly,
  vaultCategoryLabel,
} from "@/lib/copy/vaultTerms";

export type VaultSuggestion = {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  prompt: string;
};

export type VaultTipContextItem = {
  category: string;
  label: string;
  summary?: string;
  uploadedAt?: string;
};

const CATEGORY_PROMPTS: Record<string, { title: string; description: string; prompt: string }> = {
  wallet: {
    title: "Wallet activity",
    description: "Balances, tokens, and recent sync",
    prompt: "Summarize what my wallet sync shows — balances, tokens, and anything notable.",
  },
  travel: {
    title: "Travel plans",
    description: "Trips, bookings, and itineraries",
    prompt: "What do my travel files say about upcoming or recent trips?",
  },
  subscription: {
    title: "Subscriptions",
    description: "Recurring services and renewals",
    prompt: "What subscriptions or renewals appear in my vault?",
  },
  document: {
    title: "Documents",
    description: "Key points from uploaded docs",
    prompt: "What are the main takeaways from my uploaded documents?",
  },
  briefing: {
    title: "Briefings",
    description: "Notes and summaries you've saved",
    prompt: "Summarize the briefings and notes in my vault.",
  },
  spend: {
    title: "Spending",
    description: "Expenses and purchase patterns",
    prompt: "What spending patterns or totals show up in my vault data?",
  },
  tx: {
    title: "Transactions",
    description: "On-chain or recorded activity",
    prompt: "Highlight important transactions or transfers in my vault.",
  },
  contract: {
    title: "Contracts",
    description: "Terms and obligations",
    prompt: "What should I know from the contracts in my vault?",
  },
  board: {
    title: "Saved chats",
    description: "Prior Concierge conversations",
    prompt: "Summarize themes from my saved chat sessions.",
  },
  trade: {
    title: "Trading notes",
    description: "Desk sessions and trade memory",
    prompt: "What trading context or decisions are recorded in my vault?",
  },
};

function normalizeCategoryKey(category: string): string {
  if (category.startsWith("evidence:")) {
    return category.slice("evidence:".length);
  }
  return category;
}

function withIds(questions: Omit<VaultSuggestion, "id">[]): VaultSuggestion[] {
  const seen = new Set<string>();
  return questions.map((q, index) => {
    let id = q.prompt.trim() || `suggestion-${index}`;
    if (seen.has(id)) id = `${id}-${index}`;
    seen.add(id);
    return { ...q, id };
  });
}

function formatUploadedAt(ts: number): string {
  const d = new Date(ts * 1000);
  const diff = Date.now() - d.getTime();
  if (diff < 86400000) return "today";
  if (diff < 86400000 * 2) return "yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function overviewQuestion(knowledgeCount: number): Omit<VaultSuggestion, "id"> {
  return {
    icon: Sparkles,
    title: "Vault overview",
    description:
      knowledgeCount === 1
        ? "One knowledge file loaded"
        : `${knowledgeCount} knowledge files loaded`,
    prompt: "Give me a concise overview of what my vault knows.",
  };
}

function categoryQuestion(
  category: string,
  count: number
): Omit<VaultSuggestion, "id"> | null {
  const key = normalizeCategoryKey(category);
  const template = CATEGORY_PROMPTS[key];
  const label = vaultCategoryLabel(category);

  if (template) {
    return {
      icon: Lightbulb,
      title: template.title,
      description:
        count > 1 ? `${count} ${label.toLowerCase()} files` : template.description,
      prompt: template.prompt,
    };
  }

  if (key === "unassigned") return null;

  return {
    icon: Lightbulb,
    title: label,
    description: count > 1 ? `${count} files in this category` : "From your knowledge base",
    prompt: `What can you tell me about my ${label.toLowerCase()} files in the vault?`,
  };
}

/** Curated starter questions — never raw file hashes or internal labels. */
export function buildVaultFallbackQuestions(files: VaultFile[]): VaultSuggestion[] {
  const knowledge = files.filter(isAgentKnowledge);
  const storedOnly = files.filter(isStoredOnly);

  if (files.length === 0) {
    return withIds([
      {
        icon: Upload,
        title: "Get started",
        description: "Upload your first files",
        prompt: "What should I upload to get the most out of Concierge?",
      },
      {
        icon: Lightbulb,
        title: "How it works",
        description: "Vault → knowledge → chat",
        prompt: "How do vault uploads become answers in Chat?",
      },
      {
        icon: Sparkles,
        title: "Quick add",
        description: "Skip the feed step",
        prompt: "What is Quick add and when should I use it?",
      },
    ]);
  }

  if (knowledge.length === 0) {
    const n = storedOnly.length;
    return withIds([
      {
        icon: Upload,
        title: "Feed your files",
        description: `${n} stored file${n === 1 ? "" : "s"} not in knowledge base yet`,
        prompt: "What do I need to do before Chat can read my uploaded files?",
      },
      {
        icon: Lightbulb,
        title: "What's waiting",
        description: "Stored on 0G, not summarized yet",
        prompt: "Summarize what I have stored in my vault so far.",
      },
      {
        icon: Sparkles,
        title: "Quick add option",
        description: "Structured uploads skip feeding",
        prompt: "How can I add agent knowledge without feeding each file?",
      },
    ]);
  }

  const categoryRank = new Map<string, { count: number; latest: number }>();
  for (const file of knowledge) {
    const key = file.category || "document";
    const cur = categoryRank.get(key) ?? { count: 0, latest: 0 };
    cur.count += 1;
    cur.latest = Math.max(cur.latest, file.timestamp);
    categoryRank.set(key, cur);
  }

  const ranked = [...categoryRank.entries()].sort(
    (a, b) => b[1].latest - a[1].latest || b[1].count - a[1].count
  );

  const questions: Omit<VaultSuggestion, "id">[] = [overviewQuestion(knowledge.length)];

  for (const [category, meta] of ranked) {
    if (questions.length >= 3) break;
    const q = categoryQuestion(category, meta.count);
    if (q) questions.push(q);
  }

  while (questions.length < 3) {
    questions.push({
      icon: Lightbulb,
      title: "Recent changes",
      description: "Latest knowledge in your vault",
      prompt: "What changed or was added recently in my vault?",
    });
    break;
  }

  return withIds(questions.slice(0, 3));
}

/** Context for /api/chatTips — knowledge files only, human-readable labels. */
export async function buildVaultTipContext(
  files: VaultFile[],
  fetchFileContent: (hash: string) => Promise<string>
): Promise<VaultTipContextItem[]> {
  const knowledge = [...files]
    .filter(isAgentKnowledge)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 8);

  return Promise.all(
    knowledge.map(async (f) => {
      let summary = "";
      if (f.insightsCID && f.insightsCID !== "0x" + "0".repeat(64)) {
        try {
          summary = (await fetchFileContent(f.insightsCID)).slice(0, 500);
        } catch {
          summary = "";
        }
      }

      const label = vaultCategoryLabel(f.category);
      const key = normalizeCategoryKey(f.category);

      return {
        category: key,
        label,
        summary:
          summary.trim() ||
          (isStoredOnly(f)
            ? "Stored only — not yet in knowledge base"
            : `Knowledge file (${label})`),
        uploadedAt: formatUploadedAt(f.timestamp),
      };
    })
  );
}

/** Non-AI fallback for chatTips when inference is unavailable. */
export function buildTipsFromContext(
  context: VaultTipContextItem[]
): { summary: string; questions: { title: string; description: string; prompt: string }[] } {
  if (!context.length) {
    return {
      summary: "Feed files in Knowledge base to get personalized questions.",
      questions: STATIC_VAULT_TIPS.map(({ title, description, prompt }) => ({
        title,
        description,
        prompt,
      })),
    };
  }

  const categoryRank = new Map<string, { count: number; label: string }>();
  for (const item of context) {
    const key = item.category || "document";
    const cur = categoryRank.get(key) ?? { count: 0, label: item.label };
    cur.count += 1;
    categoryRank.set(key, cur);
  }

  const ranked = [...categoryRank.entries()].sort((a, b) => b[1].count - a[1].count);
  const questions: { title: string; description: string; prompt: string }[] = [
    {
      title: "Vault overview",
      description: `${context.length} knowledge file${context.length === 1 ? "" : "s"} loaded`,
      prompt: "Give me a concise overview of what my vault knows.",
    },
  ];

  for (const [category, meta] of ranked) {
    if (questions.length >= 3) break;
    const template = CATEGORY_PROMPTS[category];
    if (template) {
      questions.push({
        title: template.title,
        description:
          meta.count > 1
            ? `${meta.count} ${meta.label.toLowerCase()} files`
            : template.description,
        prompt: template.prompt,
      });
    } else if (category !== "unassigned") {
      questions.push({
        title: meta.label,
        description: "From your knowledge base",
        prompt: `What can you tell me about my ${meta.label.toLowerCase()} files?`,
      });
    }
  }

  while (questions.length < 3) {
    questions.push({
      title: STATIC_VAULT_TIPS[questions.length]?.title ?? "Follow up",
      description: STATIC_VAULT_TIPS[questions.length]?.description ?? "Next questions",
      prompt: STATIC_VAULT_TIPS[questions.length]?.prompt ?? "What should I ask next?",
    });
  }

  const topLabel = context[0]?.label ?? "your files";
  return {
    summary: `Suggestions based on ${topLabel}${context.length > 1 ? ` and ${context.length - 1} more` : ""}.`,
    questions: questions.slice(0, 3),
  };
}

export const STATIC_VAULT_TIPS: VaultSuggestion[] = withIds([
  {
    icon: Sparkles,
    title: "Vault overview",
    description: "Summarize everything loaded",
    prompt: "Summarize what my vault knows from recent uploads.",
  },
  {
    icon: Lightbulb,
    title: "Recent uploads",
    description: "Focus on the latest files",
    prompt: "What stands out in my most recent knowledge files?",
  },
  {
    icon: Lightbulb,
    title: "Follow up",
    description: "Gaps or next steps",
    prompt: "What should I ask next based on what's in my vault?",
  },
]);
