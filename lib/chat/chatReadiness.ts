import { isAgentKnowledge } from "@/lib/copy/vaultTerms";
import type { VaultFile } from "@/hooks/useUserFiles";

export type ChatIntent = "casual" | "vault";

export type ChatBlocker =
  | "disconnected"
  | "no_files"
  | "no_knowledge"
  | "compute"
  | "loading"
  | "load_failed"
  | null;

export type ChatReadinessInput = {
  intent: ChatIntent;
  isConnected: boolean;
  loadingEvidence: boolean;
  totalFiles: number;
  knowledgeFiles: number;
  askableCount: number;
  /** Operator pool (Router) or legacy direct ledger ready */
  canCompute: boolean;
  /** When true, users skip ledger setup — Concierge covers inference */
  operatorSubsidized: boolean;
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
  const computeReady = input.canCompute;

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
      href: "/dashboard/vault/upload",
      action: "Open Vault",
    },
    {
      id: "knowledge",
      label: "Turn files into agent knowledge",
      done: input.knowledgeFiles > 0,
      href: "/dashboard/knowledge/feed",
      action: "Feed files",
    },
    {
      id: "ledger",
      label: "Create compute ledger",
      done: input.hasLedger || input.operatorSubsidized,
      href: "/dashboard/knowledge/compute",
      action: "Set up compute",
    },
    {
      id: "balance",
      label: "Deposit OG into ledger",
      done: input.hasBalance || input.operatorSubsidized,
      href: "/dashboard/knowledge/compute",
      action: "Fund ledger",
    },
    {
      id: "provider",
      label: "Fund an AI model provider",
      done: input.hasFundedProvider || input.operatorSubsidized,
      href: "/dashboard/knowledge/compute",
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
        input.intent === "casual"
          ? "Connect a 0G wallet to chat with Concierge."
          : "Chat runs on your vault. Connect a 0G wallet to ask what your files know.",
      steps,
    };
  }

  if (input.intent === "casual") {
    if (!computeReady) {
      return {
        canSend: false,
        blocker: "compute",
        title: "Compute unavailable",
        detail:
          "Concierge inference is temporarily unavailable. The operator pool needs funding — try again later.",
        steps,
      };
    }

    return {
      canSend: true,
      blocker: null,
      title: "Ready to chat",
      detail: input.operatorSubsidized
        ? "Casual mode · compute covered by Concierge"
        : "Casual mode · compute funded",
      steps,
    };
  }

  if (input.loadingEvidence) {
    return {
      canSend: false,
      blocker: "loading",
      title: "Loading agent knowledge…",
      detail:
        "Checking which vault files Chat can read — structured evidence and Insights summaries.",
      steps,
    };
  }

  if (input.totalFiles === 0) {
    return {
      canSend: false,
      blocker: "no_files",
      title: "No vault files yet",
      detail:
        "Uploads land on 0G first. Add files in Vault, then feed them in Knowledge base so Chat can answer.",
      steps,
    };
  }

  if (input.knowledgeFiles === 0) {
    return {
      canSend: false,
      blocker: "no_knowledge",
      title: "Stored files — not agent knowledge yet",
      detail: `You have ${input.totalFiles} stored file${input.totalFiles === 1 ? "" : "s"}, but Chat can't use raw uploads. Feed files in Knowledge base or use Quick add.`,
      steps,
    };
  }

  if (!computeReady) {
    const computeDetail = input.operatorSubsidized
      ? "Concierge inference is temporarily unavailable. Try again later."
      : !input.hasLedger
        ? "Create your compute ledger on the Knowledge base Compute page — Chat uses 0G Compute."
        : !input.hasBalance
          ? "Deposit OG into your ledger so inference can run when you send a message."
          : "Fund at least one AI model provider on the Compute page before Chat can respond.";

    return {
      canSend: false,
      blocker: "compute",
      title: input.operatorSubsidized ? "Compute unavailable" : "Finish compute setup",
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
        "Your vault has knowledge files, but Chat couldn't read them from storage. Try Refresh or re-feed on Knowledge base.",
      steps,
    };
  }

  return {
    canSend: true,
    blocker: null,
    title: "Ready to chat",
    detail: input.operatorSubsidized
      ? `${input.askableCount} knowledge file${input.askableCount === 1 ? "" : "s"} loaded · compute covered by Concierge`
      : `${input.askableCount} knowledge file${input.askableCount === 1 ? "" : "s"} loaded · compute funded`,
    steps,
  };
}
