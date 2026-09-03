import type { VaultFile } from "@/hooks/useUserFiles";
import type { MyAgenticId } from "@/hooks/useAgenticId";
import {
  evidenceTypeFromCategory,
  isEvidenceCategory,
} from "@/lib/evidence";
import { isAgentKnowledge } from "@/lib/copy/vaultTerms";
import { ZERO_G_CHAIN_IDS } from "@/lib/addresses";
import { zeroGMainnet, zeroGTestnet } from "@/lib/wagmi/config";
import { formatOG } from "@/hooks/useComputeLedger";

export type HomeStats = {
  vaultFiles: number;
  /** Stored on 0G + vault registry (all files) */
  storedFiles: number;
  /** Structured or Insights-enriched — agents can use */
  agentKnowledge: number;
  /** Uploaded but not yet knowledge */
  storedOnly: number;
  analyzedFiles: number;
  unlabeledFiles: number;
  chatSessions: number;
  tradeDecisions: number;
  knowledgePct: number;
  analyzedPct: number;
};

export type ActionPriority = "critical" | "recommended" | "optional";

export type DashboardAction = {
  id: string;
  priority: ActionPriority;
  title: string;
  detail: string;
  href: string;
  cta: string;
};

export type ChartBucket = {
  label: string;
  value: number;
  color?: string;
};

export type NetworkInfo = {
  chainId: number | undefined;
  name: string;
  isTestnet: boolean;
  onZeroG: boolean;
};

const CATEGORY_COLORS: Record<string, string> = {
  unassigned: "var(--muted-foreground)",
  wallet: "var(--brand)",
  board: "#6366f1",
  trade: "#f59e0b",
  document: "#10b981",
  briefing: "#8b5cf6",
  spend: "#ec4899",
  other: "#64748b",
};

export function networkFromChainId(chainId: number | undefined): NetworkInfo {
  if (chainId === zeroGMainnet.id) {
    return {
      chainId,
      name: "0G Mainnet",
      isTestnet: false,
      onZeroG: true,
    };
  }
  if (chainId === zeroGTestnet.id) {
    return {
      chainId,
      name: "0G Galileo Testnet",
      isTestnet: true,
      onZeroG: true,
    };
  }
  return {
    chainId,
    name: chainId ? `Chain ${chainId}` : "Not connected",
    isTestnet: false,
    onZeroG: chainId
      ? (ZERO_G_CHAIN_IDS as readonly number[]).includes(chainId)
      : false,
  };
}

export function buildHomeStats(files: VaultFile[]): HomeStats {
  const knowledge = files.filter(isAgentKnowledge);
  const analyzed = files.filter(
    (f) =>
      f.category !== "unassigned" ||
      (f.insightsCID && f.insightsCID !== "" && f.insightsCID !== "0x")
  );
  const unlabeled = files.filter((f) => f.category === "unassigned" && !isAgentKnowledge(f));
  const chatSessions = files.filter((f) => f.category === "evidence:board");
  const tradeDecisions = files.filter((f) => f.category === "evidence:trade");

  return {
    vaultFiles: files.length,
    storedFiles: files.length,
    agentKnowledge: knowledge.length,
    storedOnly: Math.max(0, files.length - knowledge.length),
    analyzedFiles: analyzed.length,
    unlabeledFiles: unlabeled.length,
    chatSessions: chatSessions.length,
    tradeDecisions: tradeDecisions.length,
    knowledgePct:
      files.length > 0
        ? Math.min(100, Math.round((knowledge.length / files.length) * 100))
        : 0,
    analyzedPct:
      files.length > 0
        ? Math.min(100, Math.round((analyzed.length / files.length) * 100))
        : 0,
  };
}

export function buildUploadHistogram(
  files: VaultFile[],
  days = 14
): ChartBucket[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const buckets: ChartBucket[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const start = Math.floor(d.getTime() / 1000);
    const end = start + 86400;
    const count = files.filter(
      (f) => f.timestamp >= start && f.timestamp < end
    ).length;
    buckets.push({
      label:
        i === 0
          ? "Today"
          : `${d.getMonth() + 1}/${d.getDate()}`,
      value: count,
    });
  }
  return buckets;
}

export function buildCategoryBreakdown(files: VaultFile[]): ChartBucket[] {
  const counts = new Map<string, number>();
  for (const f of files) {
    const type = evidenceTypeFromCategory(f.category);
    const key =
      f.category === "unassigned"
        ? "unassigned"
        : type ?? "other";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const order = [
    "wallet",
    "board",
    "trade",
    "document",
    "briefing",
    "spend",
    "unassigned",
    "other",
  ];

  return order
    .filter((k) => (counts.get(k) ?? 0) > 0)
    .map((k) => ({
      label: categoryLabel(k),
      value: counts.get(k) ?? 0,
      color: CATEGORY_COLORS[k] ?? CATEGORY_COLORS.other,
    }));
}

function categoryLabel(key: string): string {
  const labels: Record<string, string> = {
    unassigned: "Stored only",
    wallet: "Wallet sync",
    board: "Chat sessions",
    trade: "Trade decisions",
    document: "Documents",
    briefing: "Briefings",
    spend: "Spending",
    other: "Other",
  };
  return labels[key] ?? key;
}

export function buildDashboardActions(args: {
  isConnected: boolean;
  network: NetworkInfo;
  stats: HomeStats;
  hasAgent: boolean;
  agent: MyAgenticId | null;
  ledgerExists: boolean;
  totalOG: number;
  canCompute: boolean;
  hasFundedProvider: boolean;
}): DashboardAction[] {
  const actions: DashboardAction[] = [];

  if (!args.isConnected) {
    actions.push({
      id: "connect",
      priority: "critical",
      title: "Connect your wallet",
      detail: "Link a wallet on 0G to see vault stats and run agents.",
      href: "/dashboard",
      cta: "Connect in header",
    });
    return actions;
  }

  if (!args.network.onZeroG) {
    actions.push({
      id: "network",
      priority: "critical",
      title: "Switch to 0G network",
      detail: "Concierge vault and agents run on 0G Mainnet or Galileo Testnet.",
      href: "/dashboard",
      cta: "Switch network",
    });
  }

  if (args.stats.vaultFiles === 0) {
    actions.push({
      id: "upload",
      priority: "critical",
      title: "Upload your first file",
      detail: "Sync your wallet, drop a CSV, or paste a note — stored on 0G Storage.",
      href: "/dashboard/vault",
      cta: "Open Vault",
    });
  }

  if (!args.ledgerExists) {
    actions.push({
      id: "ledger-create",
      priority: "recommended",
      title: "Create 0G Compute ledger",
      detail: `Prepaid account for AI calls. Requires at least 3 OG to create.`,
      href: "/dashboard/knowledge/compute",
      cta: "Set up Compute",
    });
  } else if (args.totalOG <= 0) {
    actions.push({
      id: "ledger-fund",
      priority: "recommended",
      title: "Fund your Compute ledger",
      detail: "Deposit OG so feeding files and chat can run inference.",
      href: "/dashboard/knowledge/compute",
      cta: "Add OG",
    });
  } else if (!args.hasFundedProvider) {
    actions.push({
      id: "provider-fund",
      priority: "recommended",
      title: "Fund an AI provider",
      detail: `${formatOG(args.totalOG)} OG on ledger — pick a model provider to enable inference.`,
      href: "/dashboard/knowledge/compute",
      cta: "Fund provider",
    });
  }

  if (
    args.stats.unlabeledFiles > 0 &&
    args.canCompute &&
    args.stats.vaultFiles > 0
  ) {
    actions.push({
      id: "knowledge",
      priority: "recommended",
      title: `Turn ${args.stats.unlabeledFiles} stored file${args.stats.unlabeledFiles === 1 ? "" : "s"} into agent knowledge`,
      detail: "Feed stored uploads on the Knowledge base to categorize and summarize them.",
      href: "/dashboard/knowledge/feed",
      cta: "Feed files",
    });
  }

  if (args.stats.vaultFiles > 0 && args.stats.agentKnowledge === 0) {
    actions.push({
      id: "chat-blocked",
      priority: "recommended",
      title: "Build agent knowledge before chat",
      detail:
        "You have stored files, but Concierge can’t use raw uploads yet. Run Insights or Quick add.",
      href: "/dashboard/knowledge/feed",
      cta: "Open Knowledge base",
    });
  } else if (
    args.stats.agentKnowledge > 0 &&
    args.canCompute &&
    args.stats.chatSessions === 0
  ) {
    actions.push({
      id: "chat",
      priority: "recommended",
      title: "Start your first chat",
      detail: "Ask Concierge about vault knowledge — or chat casually.",
      href: "/dashboard/advisor/chat",
      cta: "Open chat",
    });
  }

  if (!args.hasAgent && args.stats.agentKnowledge > 0) {
    actions.push({
      id: "mint-agent",
      priority: "recommended",
      title: "Mint your Agentic ID",
      detail:
        "One Concierge identity per wallet — bound to your vault. Required to list, rent, or transfer.",
      href: "/dashboard/agent/mint",
      cta: "Mint Agentic ID",
    });
  }

  if (args.hasAgent && args.stats.agentKnowledge > 0) {
    actions.push({
      id: "ecosystem",
      priority: "optional",
      title: "List or rent your Concierge",
      detail: "Marketplace sale, timed rentals, or free P2P transfer.",
      href: "/dashboard/ecosystem",
      cta: "Open Ecosystem",
    });
  }

  if (args.stats.tradeDecisions > 0) {
    actions.push({
      id: "trade-review",
      priority: "optional",
      title: "Review trading desk activity",
      detail: `${args.stats.tradeDecisions} decision${args.stats.tradeDecisions === 1 ? "" : "s"} saved — secondary to the vault loop.`,
      href: "/dashboard/trading/desk",
      cta: "Open Desk",
    });
  }

  if (args.agent?.access === "rental" && args.agent.rentalExpiresAt) {
    const daysLeft = Math.ceil(
      (args.agent.rentalExpiresAt * 1000 - Date.now()) / 86400000
    );
    if (daysLeft <= 7) {
      actions.push({
        id: "rental-expiry",
        priority: "optional",
        title: "Rental expiring soon",
        detail: `Agentic ID rental ends in ~${Math.max(0, daysLeft)} day${daysLeft === 1 ? "" : "s"}.`,
        href: "/dashboard/ecosystem/rent",
        cta: "Manage rental",
      });
    }
  }

  return actions;
}

export type JourneyProgress = {
  id: string;
  label: string;
  done: boolean;
  href: string;
};

export function buildJourneyProgress(args: {
  stats: HomeStats;
  hasAgent: boolean;
  ledgerExists: boolean;
  canCompute: boolean;
  isConnected: boolean;
}): JourneyProgress[] {
  if (!args.isConnected) {
    return JOURNEY_PROGRESS_TEMPLATE.map((s) => ({ ...s, done: false }));
  }
  return [
    {
      id: "vault",
      label: "Vault",
      done: args.stats.vaultFiles > 0,
      href: "/dashboard/vault",
    },
    {
      id: "knowledge",
      label: "Knowledge",
      done: args.stats.agentKnowledge > 0 && args.ledgerExists,
      href: "/dashboard/knowledge",
    },
    {
      id: "chat",
      label: "chat",
      done: args.stats.chatSessions > 0,
      href: "/dashboard/advisor/chat",
    },
    {
      id: "agent",
      label: "Agentic ID",
      done: args.hasAgent,
      href: "/dashboard/agent/mint",
    },
    {
      id: "ecosystem",
      label: "Ecosystem",
      done: args.hasAgent,
      href: "/dashboard/ecosystem",
    },
  ];
}

const JOURNEY_PROGRESS_TEMPLATE: JourneyProgress[] = [
  { id: "vault", label: "Vault", done: false, href: "/dashboard/vault" },
  { id: "knowledge", label: "Knowledge", done: false, href: "/dashboard/knowledge" },
  { id: "chat", label: "Chat", done: false, href: "/dashboard/advisor/chat" },
  { id: "agent", label: "Agentic ID", done: false, href: "/dashboard/agent/mint" },
  { id: "ecosystem", label: "Ecosystem", done: false, href: "/dashboard/ecosystem" },
];
