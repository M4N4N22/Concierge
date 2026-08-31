import { keccak256, stringToHex, type Hex } from "viem";
import type { VaultFile } from "@/hooks/useUserFiles";

export type AgenticMintPayload = {
  vault: `0x${string}`;
  encryptedHash: Hex;
  domain: string;
  embeddingURI: string;
  aiSignature: string;
};

/** Fingerprint vault evidence for Agentic ID encrypted metadata (bytes32). */
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
    domain: "concierge.agent",
    embeddingURI: primaryRoot
      ? `0g://storage/${primaryRoot}`
      : `0g://concierge/${owner.toLowerCase()}`,
    aiSignature: "concierge_v1",
  };
}
