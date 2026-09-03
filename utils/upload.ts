import { toast } from "sonner";

export type UploadFileResult = {
  rootHash: string;
  alreadyExists?: boolean;
};

export const uploadFileSafe = async (
  file: File,
  options?: { silent?: boolean; chainId?: number; useTestnet?: boolean }
): Promise<UploadFileResult | null> => {
  const silent = options?.silent ?? false;
  const formData = new FormData();
  formData.append("files", file);

  const chainId =
    typeof options?.chainId === "number"
      ? options.chainId
      : typeof options?.useTestnet === "boolean"
        ? options.useTestnet
          ? 16602
          : 16661
        : undefined;
  if (typeof chainId === "number") {
    formData.append("chainId", String(chainId));
  }

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
    category?: string;
    encryptedKey?: string;
    /** Prefer chainId; useTestnet kept for callers that only know network flag. */
    chainId?: number;
    useTestnet?: boolean;
    toastId?: string | number;
    successMessage?: string;
  }
): Promise<{ rootHash: string; txHash?: string; alreadyExists?: boolean } | null> {
  const toastId =
    options?.toastId ?? toast.loading(`Uploading ${file.name} to 0G Storage…`);

  try {
    options?.onProgress?.("storage");
    const stored = await uploadFileSafe(file, {
      silent: true,
      chainId: options?.chainId,
      useTestnet: options?.useTestnet,
    });
    if (!stored) {
      toast.error(`Storage failed for ${file.name}. Check server env keys.`, {
        id: toastId,
      });
      return null;
    }

    if (stored.alreadyExists) {
      toast.info(`${file.name} already on 0G Storage — registering on vault…`, {
        id: toastId,
      });
    } else {
      toast.loading(`Confirm vault transaction in your wallet…`, { id: toastId });
    }

    options?.onProgress?.("vault");

    const resolvedInsightsCID =
      typeof insightsCID === "function"
        ? insightsCID(stored.rootHash)
        : insightsCID;

    const txHash = await addFile({
      rootHash: stored.rootHash,
      category: options?.category ?? "unassigned",
      encryptedKey: options?.encryptedKey ?? "",
      insightsCID: resolvedInsightsCID,
      useTestnet: options?.useTestnet,
    });

    toast.success(
      options?.successMessage ?? `${file.name} is in your vault`,
      { id: toastId }
    );
    return { rootHash: stored.rootHash, txHash, alreadyExists: stored.alreadyExists };
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
