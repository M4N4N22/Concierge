import { toast } from "sonner";

export type UploadFileResult = {
  rootHash: string;
  alreadyExists?: boolean;
};

export const uploadFileSafe = async (
  file: File,
  options?: { silent?: boolean }
): Promise<UploadFileResult | null> => {
  const silent = options?.silent ?? false;
  const formData = new FormData();
  formData.append("files", file);

  try {
    const res = await fetch("/api/uploadFile", { method: "POST", body: formData });
    const data = await res.json();

    if (!res.ok) {
      const message = data?.error || "Storage upload failed";
      if (!silent) toast.error(`${file.name}: ${message}`);
      return null;
    }

    const item = data.uploaded?.[0];
    if (!item?.rootHash) {
      if (!silent) toast.error(`${file.name}: no storage hash returned`);
      return null;
    }

    return { rootHash: item.rootHash, alreadyExists: item.alreadyExists };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error";
    if (!silent) toast.error(`${file.name}: ${message}`);
    return null;
  }
};

export function isUserRejectedError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: number; message?: string; shortMessage?: string };
  const msg = `${e.message ?? ""} ${e.shortMessage ?? ""}`.toLowerCase();
  return e.code === 4001 || /user rejected|denied|cancelled|canceled/.test(msg);
}

type AddFileFn = (args: {
  rootHash: string;
  category?: string;
  encryptedKey?: string;
  insightsCID: string;
  useTestnet?: boolean;
}) => Promise<string>;

/** Full flow: 0G Storage upload → on-chain vault register, with accurate toasts. */
export async function uploadAndRegisterOnVault(
  file: File,
  addFile: AddFileFn,
  insightsCID: string | ((rootHash: string) => string),
  options?: {
    onProgress?: (phase: "storage" | "vault") => void;
  }
): Promise<{ rootHash: string; txHash?: string; alreadyExists?: boolean } | null> {
  const toastId = toast.loading(`Uploading ${file.name} to 0G Storage…`);

  try {
    options?.onProgress?.("storage");
    const stored = await uploadFileSafe(file, { silent: true });
    if (!stored) {
      toast.error(`Storage failed for ${file.name}. Check server env keys.`, {
        id: toastId,
      });
      return null;
    }

    if (stored.alreadyExists) {
      toast.info(`${file.name} already on 0G Storage — skipped duplicate upload`, {
        id: toastId,
      });
      return { rootHash: stored.rootHash, alreadyExists: true };
    }

    toast.loading(`Confirm vault transaction in your wallet…`, { id: toastId });

    options?.onProgress?.("vault");

    const resolvedInsightsCID =
      typeof insightsCID === "function"
        ? insightsCID(stored.rootHash)
        : insightsCID;

    const txHash = await addFile({
      rootHash: stored.rootHash,
      category: "unassigned",
      encryptedKey: "",
      insightsCID: resolvedInsightsCID,
      useTestnet: true,
    });

    toast.success(`${file.name} is in your vault`, { id: toastId });
    return { rootHash: stored.rootHash, txHash };
  } catch (err: unknown) {
    if (isUserRejectedError(err)) {
      toast.error(`Transaction cancelled — ${file.name} not added to vault`, {
        id: toastId,
      });
    } else {
      const message =
        err instanceof Error ? err.message : "Vault registration failed";
      toast.error(`${file.name}: ${message}`, { id: toastId });
    }
    return null;
  }
}

export const DUMMY_CONTENTS = [`Dining Spent: $200 on 2025-11-3.`];
