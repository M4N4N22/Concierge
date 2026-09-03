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

export type ChatReadinessStep = {
  id: string;
  label: string;
  done: boolean;
  href?: string;
  action?: string;
};

export type ChatReadinessInput = {
  intent: ChatIntent;
  isConnected: boolean;
  loadingEvidence: boolean;
  computeChecking: boolean;
  totalFiles: number;
  knowledgeFiles: number;
  askableCount: number;
  canCompute: boolean;
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
  steps: ChatReadinessStep[];
  /** Hide the step checklist — used during background loading */
  hideSteps?: boolean;
};

export function countAgentKnowledge(files: VaultFile[]): number {
  return files.filter((f) => isAgentKnowledge(f)).length;
}

function buildSteps(input: ChatReadinessInput): ChatReadinessStep[] {
  const steps: ChatReadinessStep[] = [
    {
      id: "wallet",
      label: "Connect wallet",
      done: input.isConnected,
    },
  ];

  if (input.intent === "vault") {
    steps.push(
      {
        id: "files",
        label: "Add files to your vault",
        done: input.totalFiles > 0,
        href: "/dashboard/vault/upload",
        action: "Upload",
      },
      {
        id: "knowledge",
        label: "Feed files into knowledge base",
        done: input.knowledgeFiles > 0,
        href: "/dashboard/knowledge/feed",
        action: "Feed files",
      }
    );
  }

  if (!input.operatorSubsidized) {
    steps.push(
      {
        id: "ledger",
        label: "Create compute ledger",
        done: input.hasLedger,
        href: "/dashboard/knowledge/compute",
        action: "Set up compute",
      },
      {
        id: "balance",
        label: "Deposit OG into ledger",
        done: input.hasBalance,
        href: "/dashboard/knowledge/compute",
        action: "Fund ledger",
      },
      {
        id: "provider",
        label: "Fund an AI model provider",
        done: input.hasFundedProvider,
        href: "/dashboard/knowledge/compute",
        action: "Fund model",
      }
    );
  } else {
    steps.push({
      id: "compute",
      label: "Concierge compute ready",
      done: input.canCompute,
      href: "/dashboard/knowledge/compute",
      action: "View compute",
    });
  }

  if (input.intent === "vault") {
    steps.push({
      id: "askable",
      label: "Load knowledge for Chat",
      done: input.askableCount > 0,
    });
  }

  return steps;
}

export function resolveChatReadiness(input: ChatReadinessInput): ChatReadiness {
  const steps = buildSteps(input);
  const computeReady = input.canCompute;

  if (!input.isConnected) {
    return {
      canSend: false,
      blocker: "disconnected",
      title: "Connect your wallet",
      detail:
        input.intent === "casual"
          ? "Connect a 0G wallet to chat with Concierge."
          : "Connect a 0G wallet to ask questions about your vault.",
      steps,
    };
  }

  if (input.intent === "casual") {
    if (input.computeChecking) {
      return {
        canSend: false,
        blocker: "loading",
        title: "Checking compute…",
        detail: "Verifying inference is available — this takes a moment.",
        steps: [],
        hideSteps: true,
      };
    }

    if (!computeReady) {
      return {
        canSend: false,
        blocker: "compute",
        title: "Compute unavailable",
        detail: input.operatorSubsidized
          ? "Concierge inference is temporarily unavailable — try again shortly."
          : "Finish compute setup on the Knowledge base Compute page.",
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
      title: "Loading vault knowledge…",
      detail:
        "Reading your knowledge base in the background. Switch to Casual to chat now, or wait a few seconds.",
      steps: [],
      hideSteps: true,
    };
  }

  if (input.totalFiles === 0) {
    return {
      canSend: false,
      blocker: "no_files",
      title: "No vault files yet",
      detail:
        "Upload files in Vault, then feed them in Knowledge base so Chat can answer from your data.",
      steps,
    };
  }

  if (input.knowledgeFiles === 0) {
    return {
      canSend: false,
      blocker: "no_knowledge",
      title: "Files stored — not in knowledge base yet",
      detail: `You have ${input.totalFiles} stored file${input.totalFiles === 1 ? "" : "s"}. Feed them in Knowledge base or use Quick add before asking vault questions.`,
      steps,
    };
  }

  if (input.computeChecking) {
    return {
      canSend: false,
      blocker: "loading",
      title: "Checking compute…",
      detail: "Verifying inference is available.",
      steps: [],
      hideSteps: true,
    };
  }

  if (!computeReady) {
    const computeDetail = input.operatorSubsidized
      ? "Concierge inference is temporarily unavailable — try again shortly."
      : !input.hasLedger
        ? "Create your compute ledger on the Knowledge base Compute page."
        : !input.hasBalance
          ? "Deposit OG into your ledger so inference can run."
          : "Fund at least one AI model provider on the Compute page.";

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
      title: "Couldn't load knowledge",
      detail:
        "Knowledge files exist but couldn't be read from storage. Try Refresh or re-feed on Knowledge base.",
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
