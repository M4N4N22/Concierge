import { isAgentKnowledge } from "@/lib/copy/vaultTerms";
import type { VaultFile } from "@/hooks/useUserFiles";

export type ChatBlocker =
  | "disconnected"
  | "no_files"
  | "no_knowledge"
  | "compute"
  | "loading"
  | "load_failed"
  | null;

export type ChatReadinessInput = {
  isConnected: boolean;
  loadingEvidence: boolean;
  totalFiles: number;
  knowledgeFiles: number;
  askableCount: number;
  canCompute: boolean;
  hasLedger: boolean;
  hasBalance: boolean;
  hasFundedProvider: boolean;
};

export type ChatReadiness = {
  canSend: boolean;
  blocker: ChatBlocker;
  title: string;
  detail: string;
  steps: { id: string; label: string; done: boolean; href?: string; action?: string }[];
};

export function countAgentKnowledge(files: VaultFile[]): number {
  return files.filter((f) => isAgentKnowledge(f)).length;
}

export function resolveChatReadiness(input: ChatReadinessInput): ChatReadiness {
  const steps = [
    {
      id: "wallet",
      label: "Connect wallet",
      done: input.isConnected,
    },
    {
      id: "files",
      label: "Add stored files to your vault",
      done: input.totalFiles > 0,
      href: "/dashboard/vault/my-files",
      action: "Open Vault",
    },
    {
      id: "knowledge",
      label: "Turn files into agent knowledge",
      done: input.knowledgeFiles > 0,
      href: "/dashboard/vault/insights",
      action: "Run Insights",
    },
    {
      id: "ledger",
      label: "Create compute ledger",
      done: input.hasLedger,
      href: "/dashboard/vault/insights",
      action: "Set up compute",
    },
    {
      id: "balance",
      label: "Deposit OG into ledger",
      done: input.hasBalance,
      href: "/dashboard/vault/insights",
      action: "Fund ledger",
    },
    {
      id: "provider",
      label: "Fund an AI model provider",
      done: input.hasFundedProvider,
      href: "/dashboard/vault/insights",
      action: "Fund model",
    },
    {
      id: "askable",
      label: "Load knowledge for Chat",
      done: input.askableCount > 0,
    },
  ];

  if (!input.isConnected) {
    return {
      canSend: false,
      blocker: "disconnected",
      title: "Connect your wallet",
      detail:
        "Chat runs on-chain with your vault. Connect a 0G wallet to see what your agent can use and send your first question.",
      steps,
    };
  }

  if (input.loadingEvidence) {
    return {
      canSend: false,
      blocker: "loading",
      title: "Loading agent knowledge…",
      detail: "Checking which vault files Chat can read — structured evidence and Insights summaries.",
      steps,
    };
  }

  if (input.totalFiles === 0) {
    return {
      canSend: false,
      blocker: "no_files",
      title: "No vault files yet",
      detail:
        "Uploads are stored on 0G first. Add files or use Quick add in Vault, then run Insights so Chat has agent knowledge to work from.",
      steps,
    };
  }

  if (input.knowledgeFiles === 0) {
    return {
      canSend: false,
      blocker: "no_knowledge",
      title: "Stored files — not agent knowledge yet",
      detail: `You have ${input.totalFiles} stored file${input.totalFiles === 1 ? "" : "s"}, but Chat can't use raw uploads. Run Insights to categorize and summarize, or use Quick add for structured entries.`,
      steps,
    };
  }

  if (!input.canCompute) {
    const computeDetail = !input.hasLedger
      ? "Create your compute ledger on the Insights desk — Chat uses 0G Compute to answer from your vault."
      : !input.hasBalance
        ? "Deposit OG into your ledger so inference can run when you send a message."
        : "Fund at least one AI model provider on the Insights desk before Chat can respond.";

    return {
      canSend: false,
      blocker: "compute",
      title: "Finish compute setup",
      detail: computeDetail,
      steps,
    };
  }

  if (input.askableCount === 0) {
    return {
      canSend: false,
      blocker: "load_failed",
      title: "Couldn't load agent knowledge",
      detail:
        "Your vault has knowledge files, but Chat couldn't read them from storage. Try Refresh, or re-run Insights on the files that failed.",
      steps,
    };
  }

  return {
    canSend: true,
    blocker: null,
    title: "Ready to chat",
    detail: `${input.askableCount} knowledge file${input.askableCount === 1 ? "" : "s"} loaded · compute funded`,
    steps,
  };
}
