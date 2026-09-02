import { keccak256, stringToHex, type Hex } from "viem";
import type { VaultFile } from "@/hooks/useUserFiles";
import { defaultAgentDomain } from "@/lib/agentProfile";

export type AgenticMintPayload = {
  vault: `0x${string}`;
  encryptedHash: Hex;
  domain: string;
  embeddingURI: string;
  aiSignature: string;
};

/**
 * Attestation of vault file roots at a point in time (bytes32).
 * Not the Concierge brain — Chat always reads the live vault.
 * Refresh on-chain when you want marketplace/transfer honesty to match current files.
 */
export function fingerprintVaultEvidence(
  owner: string,
  vault: string,
  files: VaultFile[]
): Hex {
  const roots = [...files.map((f) => f.rootHash.toLowerCase())].sort();
  const material = [
    "concierge.agentic-id.v1",
    owner.toLowerCase(),
    vault.toLowerCase(),
    String(roots.length),
    ...roots,
  ].join("|");
  return keccak256(stringToHex(material));
}

export type VaultSealStatus = "current" | "stale" | "unknown";

export function compareVaultSeal(
  onChain: string | null | undefined,
  expected: Hex
): VaultSealStatus {
  if (!onChain || !/^0x[0-9a-fA-F]{64}$/.test(onChain)) return "unknown";
  return onChain.toLowerCase() === expected.toLowerCase() ? "current" : "stale";
}

export function buildAgenticMintPayload(args: {
  owner: string;
  vault: `0x${string}`;
  files: VaultFile[];
}): AgenticMintPayload {
  const { owner, vault, files } = args;
  const encryptedHash = fingerprintVaultEvidence(owner, vault, files);
  const primaryRoot = files[0]?.rootHash;
  return {
    vault,
    encryptedHash,
    domain: defaultAgentDomain(),
    embeddingURI: primaryRoot
      ? `0g://storage/${primaryRoot}`
      : `0g://concierge/${owner.toLowerCase()}`,
    aiSignature: "concierge_v1",
  };
}
