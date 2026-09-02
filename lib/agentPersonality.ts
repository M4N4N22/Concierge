import { uploadFileSafe } from "@/utils/upload";
import { fetchFileContent } from "@/utils/fetchFileContent";
import {
  getAgentBio,
  getAgentDisplayName,
  setAgentBio,
  setAgentDisplayName,
} from "@/lib/agentDisplayName";

export const PERSONALITY_SCHEMA = "concierge.personality.v1" as const;
export const PERSONALITY_URI_PREFIX = "0g://personality/";

export type AgentPersonality = {
  schemaVersion: typeof PERSONALITY_SCHEMA;
  name: string;
  bio: string;
  updatedAt: string;
};

export function buildPersonalityUri(rootHash: string): string {
  const hash = rootHash.replace(/^0x/, "");
  return `${PERSONALITY_URI_PREFIX}${hash.startsWith("0x") ? hash : `0x${hash}`}`;
}

export function parsePersonalityRootHash(uri: string): string | null {
  const trimmed = uri.trim();
  if (!trimmed.startsWith(PERSONALITY_URI_PREFIX)) return null;
  const hash = trimmed.slice(PERSONALITY_URI_PREFIX.length).trim();
  return hash || null;
}

export function parsePersonalityJson(raw: string): AgentPersonality | null {
  try {
    const parsed = JSON.parse(raw) as AgentPersonality;
    if (parsed?.schemaVersion !== PERSONALITY_SCHEMA) return null;
    return {
      schemaVersion: PERSONALITY_SCHEMA,
      name: String(parsed.name ?? "").trim().slice(0, 64),
      bio: String(parsed.bio ?? "").trim().slice(0, 240),
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function fetchPersonalityFromUri(
  embeddingURI: string
): Promise<AgentPersonality | null> {
  const rootHash = parsePersonalityRootHash(embeddingURI);
  if (!rootHash) return null;
  try {
    const raw = await fetchFileContent(rootHash);
    return parsePersonalityJson(raw);
  } catch {
    return null;
  }
}

/** Upload name/bio to 0G Storage; returns personality URI for on-chain profile. */
export async function publishPersonality(args: {
  name: string;
  bio: string;
}): Promise<{ uri: string; rootHash: string } | null> {
  const pack: AgentPersonality = {
    schemaVersion: PERSONALITY_SCHEMA,
    name: args.name.trim().slice(0, 64),
    bio: args.bio.trim().slice(0, 240),
    updatedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(pack, null, 2)], {
    type: "application/json",
  });
  const file = new File([blob], `concierge-personality-${Date.now()}.json`, {
    type: "application/json",
  });
  const uploaded = await uploadFileSafe(file, { silent: true });
  if (!uploaded?.rootHash) return null;
  return {
    rootHash: uploaded.rootHash,
    uri: buildPersonalityUri(uploaded.rootHash),
  };
}

export function cachePersonalityLocally(
  chainId: number,
  tokenId: bigint,
  name: string,
  bio: string
) {
  setAgentDisplayName(chainId, tokenId, name);
  setAgentBio(chainId, tokenId, bio);
}

export function readCachedPersonality(
  chainId: number,
  tokenId: bigint
): { displayName: string | null; bio: string | null } {
  return {
    displayName: getAgentDisplayName(chainId, tokenId),
    bio: getAgentBio(chainId, tokenId),
  };
}
