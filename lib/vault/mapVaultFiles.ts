import type { VaultFile } from "@/hooks/useUserFiles";

type RawVaultFile = {
  fileHash: string;
  category: string;
  insightsCID: string;
  timestamp: bigint;
};

export function mapVaultFiles(raw: RawVaultFile[]): VaultFile[] {
  const mapped = raw.map((f) => ({
    rootHash: f.fileHash,
    category: f.category,
    insightsCID: f.insightsCID,
    timestamp: Number(f.timestamp),
  }));

  const byHash = new Map<string, VaultFile>();
  for (const file of mapped) {
    const existing = byHash.get(file.rootHash);
    if (!existing || file.timestamp >= existing.timestamp) {
      if (
        existing &&
        file.timestamp === existing.timestamp &&
        existing.category !== "unassigned" &&
        file.category === "unassigned"
      ) {
        continue;
      }
      byHash.set(file.rootHash, file);
    }
  }

  return Array.from(byHash.values()).sort((a, b) => b.timestamp - a.timestamp);
}
