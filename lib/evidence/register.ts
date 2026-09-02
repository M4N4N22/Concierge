import { evidenceCategory, type VaultEvidence } from "./types";
import { evidenceToFile } from "./normalize";
import { uploadAndRegisterOnVault, isUserRejectedError } from "@/utils/upload";
import { toast } from "sonner";

type AddFileFn = (args: {
  rootHash: string;
  category?: string;
  encryptedKey?: string;
  insightsCID: string;
  useTestnet?: boolean;
}) => Promise<string>;

/** Upload a normalized evidence pack to 0G Storage and register on Vault. */
export async function registerEvidencePack(
  pack: VaultEvidence,
  addFile: AddFileFn,
  options?: {
    onProgress?: (phase: "storage" | "vault") => void;
    useTestnet?: boolean;
  }
): Promise<{ rootHash: string; txHash?: string; pack: VaultEvidence } | null> {
  const file = evidenceToFile(pack);
  const toastId = toast.loading(`Saving: ${pack.title}…`);

  try {
    const result = await uploadAndRegisterOnVault(
      file,
      addFile,
      (rootHash) => rootHash,
      {
        category: evidenceCategory(pack.type),
        encryptedKey: "",
        useTestnet: options?.useTestnet ?? true,
        onProgress: options?.onProgress,
        toastId,
        successMessage: `${pack.title} added as ${evidenceCategory(pack.type)}`,
      }
    );

    if (!result) return null;
    return { rootHash: result.rootHash, txHash: result.txHash, pack };
  } catch (err: unknown) {
    if (isUserRejectedError(err)) {
      toast.error("Transaction cancelled — file not saved", { id: toastId });
    } else {
      const message = err instanceof Error ? err.message : "Failed to register evidence";
      toast.error(message, { id: toastId });
    }
    return null;
  }
}
