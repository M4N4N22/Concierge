import {
  AGENT_DOMAINS,
  DOMAIN_META,
  matchFileToDomain,
  type AgentDomain,
} from "@/lib/domains";
import type { VaultFile } from "@/hooks/useUserFiles";

export type AgentSpecialty = AgentDomain | "general";

export type ProfileBinding = "vault" | "board" | "trade" | "unknown";

export type AgentPresentation = {
  title: string;
  subtitle: string;
  specialty: AgentSpecialty;
  specialtyLabel: string;
  tokenLabel: string;
  binding: ProfileBinding;
  bindingLabel: string;
  fileCount: number;
  indexedFileCount: number;
  isLegacyDomain: boolean;
};

const SPECIALTY_LABELS: Record<AgentSpecialty, string> = {
  finance: "Finance",
  travel: "Travel",
  subscription: "Subscriptions",
  general: "General",
};

const LEGACY_DOMAIN = "concierge.agent";

export function parseSpecialtyFromDomain(domain: string): AgentSpecialty | null {
  const normalized = domain.trim().toLowerCase();
  for (const specialty of AGENT_DOMAINS) {
    if (normalized === `${specialty}.concierge`) return specialty;
  }
  if (normalized === "general.concierge") return "general";
  return null;
}

export function specialtyToDomain(specialty: AgentSpecialty): string {
  return `${specialty}.concierge`;
}

export function inferSpecialtyFromFiles(
  files: Pick<VaultFile, "category">[]
): AgentSpecialty {
  if (!files.length) return "general";

  const counts: Record<AgentDomain, number> = {
    finance: 0,
    travel: 0,
    subscription: 0,
  };

  for (const file of files) {
    const match = matchFileToDomain(file.category);
    if (match) counts[match] += 1;
  }

  let best: AgentDomain | null = null;
  let bestCount = 0;
  for (const domain of AGENT_DOMAINS) {
    if (counts[domain] > bestCount) {
      best = domain;
      bestCount = counts[domain];
    }
  }

  return best ?? "general";
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

export function resolveAgentPresentation(args: {
  tokenId: bigint;
  domain: string;
  aiSignature?: string;
  files?: Pick<VaultFile, "category" | "insightsCID">[];
  vaultFileCount?: number;
  displayName?: string | null;
}): AgentPresentation {
  const files = args.files ?? [];
  const fileCount = args.vaultFileCount ?? files.length;
  const parsed = parseSpecialtyFromDomain(args.domain);
  const isLegacyDomain =
    !args.domain.trim() || args.domain.trim().toLowerCase() === LEGACY_DOMAIN;

  const specialty =
    parsed ?? (files.length ? inferSpecialtyFromFiles(files) : "general");

  const domainMeta =
    specialty !== "general" ? DOMAIN_META[specialty as AgentDomain] : null;

  const defaultTitle =
    domainMeta?.title.replace(/ Agent$/, " Concierge") ?? "Concierge Agent";

  const title = args.displayName?.trim() || defaultTitle;
  const subtitle =
    domainMeta?.description ??
    (fileCount
      ? `Grounded in ${fileCount} vault file${fileCount === 1 ? "" : "s"} — Chat, Learning, and Desk use this evidence.`
      : "Personal AI agent on 0G — add vault files to sharpen recommendations.");

  const binding = parseProfileBinding(args.aiSignature ?? "");
  const indexedFileCount = files.length
    ? files.filter((f) => f.insightsCID?.trim()).length
    : 0;

  return {
    title,
    subtitle,
    specialty,
    specialtyLabel: SPECIALTY_LABELS[specialty],
    tokenLabel: `#${args.tokenId.toString()}`,
    binding,
    bindingLabel: BINDING_LABELS[binding],
    fileCount,
    indexedFileCount,
    isLegacyDomain,
  };
}
