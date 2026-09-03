import { matchFileToDomain, type AgentDomain } from "@/lib/domains";
import { isAgentKnowledge, vaultCategoryLabel } from "@/lib/copy/vaultTerms";
import type { VaultFile } from "@/hooks/useUserFiles";

export type ProfileBinding = "vault" | "board" | "trade" | "unknown";

export type AgentPresentation = {
  title: string;
  subtitle: string;
  /** Vault focus lenses present in evidence (not agent type). */
  focusTags: string[];
  tokenLabel: string;
  binding: ProfileBinding;
  bindingLabel: string;
  fileCount: number;
  indexedFileCount: number;
};

const DEFAULT_DOMAIN = "concierge.agent";

export function defaultAgentDomain(): string {
  return DEFAULT_DOMAIN;
}

export function parseProfileBinding(aiSignature: string): ProfileBinding {
  const sig = aiSignature.trim();
  if (sig.startsWith("guard:")) return "board";
  if (sig.startsWith("trade:")) return "trade";
  if (sig.startsWith("concierge_v") || sig === "concierge_v1") return "vault";
  return "unknown";
}

const BINDING_LABELS: Record<ProfileBinding, string> = {
  vault: "Vault evidence",
  board: "Board session",
  trade: "Trading desk",
  unknown: "Custom profile",
};

const FOCUS_LABELS: Record<AgentDomain, string> = {
  finance: "Finance",
  travel: "Travel",
  subscription: "Subscriptions",
};

/** Which chat focus chips appear in this vault — not the agent’s type. */
export function vaultFocusTags(
  files: Pick<VaultFile, "category">[]
): string[] {
  const seen = new Set<AgentDomain>();
  for (const file of files) {
    const match = matchFileToDomain(file.category);
    if (match) seen.add(match);
  }
  return (["finance", "travel", "subscription"] as AgentDomain[])
    .filter((d) => seen.has(d))
    .map((d) => FOCUS_LABELS[d]);
}

function topCategoryLabels(
  files: Pick<VaultFile, "category">[],
  limit = 3
): string[] {
  const counts = new Map<string, number>();
  for (const file of files) {
    const key = file.category?.trim();
    if (!key || key === "unassigned") continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([cat]) => vaultCategoryLabel(cat));
}

export function buildVaultSubtitle(args: {
  fileCount: number;
  files: Pick<VaultFile, "category">[];
  bio?: string | null;
}): string {
  const bio = args.bio?.trim();
  if (bio) return bio;

  if (!args.fileCount) {
    return "Personal Concierge on 0G — upload files and feed them in Knowledge base so Chat can answer.";
  }

  const labels = topCategoryLabels(args.files);
  const focus = vaultFocusTags(args.files);
  const parts = [
    `Grounded in ${args.fileCount} vault file${args.fileCount === 1 ? "" : "s"}`,
  ];
  if (labels.length) {
    parts.push(labels.join(", "));
  } else if (focus.length) {
    parts.push(`focus: ${focus.join(", ").toLowerCase()}`);
  }
  return `${parts.join(" · ")}.`;
}

export function resolveAgentPresentation(args: {
  tokenId: bigint;
  domain?: string;
  aiSignature?: string;
  files?: Pick<VaultFile, "category" | "insightsCID">[];
  vaultFileCount?: number;
  displayName?: string | null;
  bio?: string | null;
}): AgentPresentation {
  const files = args.files ?? [];
  const fileCount = args.vaultFileCount ?? files.length;
  const binding = parseProfileBinding(args.aiSignature ?? "");
  const indexedFileCount = files.length
    ? files.filter((f) => isAgentKnowledge(f)).length
    : 0;

  return {
    title: args.displayName?.trim() || "Concierge Agent",
    subtitle: buildVaultSubtitle({
      fileCount,
      files,
      bio: args.bio,
    }),
    focusTags: vaultFocusTags(files),
    tokenLabel: `#${args.tokenId.toString()}`,
    binding,
    bindingLabel: BINDING_LABELS[binding],
    fileCount,
    indexedFileCount,
  };
}
