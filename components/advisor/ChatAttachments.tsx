"use client";

import { useMemo, useRef, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import {
  FileText,
  FolderOpen,
  Loader2,
  Paperclip,
  X,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useAddToVault } from "@/hooks/useAddToVault";
import type { VaultFile } from "@/hooks/useUserFiles";
import type { VaultEvidence } from "@/lib/evidence";
import {
  evidenceCategory,
  evidenceToFile,
  normalizeFromFileContent,
} from "@/lib/evidence";
import { loadEvidenceForFiles } from "@/lib/vault/askableContext";
import { vaultCategoryLabel } from "@/lib/copy/vaultTerms";
import { uploadAndRegisterOnVault } from "@/utils/upload";
import { truncateHash } from "@/lib/explorer";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type ChatAttachment = {
  id: string;
  label: string;
  source: "device" | "vault";
  rootHash: string;
  evidence: VaultEvidence | null;
  status: "uploading" | "ready" | "error";
};

function vaultFileLabel(file: VaultFile) {
  if (file.category && file.category !== "unassigned") {
    return vaultCategoryLabel(file.category);
  }
  return `File ${truncateHash(file.rootHash, 6, 4)}`;
}

export function useChatAttachments({
  files,
  fetchFileContent,
  onVaultChange,
}: {
  files: VaultFile[];
  fetchFileContent: (hash: string) => Promise<string>;
  onVaultChange?: () => void | Promise<void>;
}) {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { addFile } = useAddToVault();
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const deviceInputRef = useRef<HTMLInputElement>(null);

  const uploading = attachments.some((a) => a.status === "uploading");
  const readyEvidence = useMemo(
    () =>
      attachments
        .filter((a) => a.status === "ready" && a.evidence)
        .map((a) => a.evidence!),
    [attachments]
  );

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const clearAttachments = () => setAttachments([]);

  const attachFromVault = async (rootHashes: string[]) => {
    if (!rootHashes.length) return;

    const existing = new Set(
      attachments.filter((a) => a.status !== "error").map((a) => a.rootHash)
    );
    const toAdd = rootHashes.filter((h) => !existing.has(h));
    if (!toAdd.length) {
      toast.info("Already attached");
      return;
    }

    const placeholders: ChatAttachment[] = toAdd.map((rootHash) => {
      const file = files.find((f) => f.rootHash === rootHash);
      return {
        id: `vault_${rootHash}`,
        label: file ? vaultFileLabel(file) : truncateHash(rootHash, 6, 4),
        source: "vault",
        rootHash,
        evidence: null,
        status: "uploading",
      };
    });
    setAttachments((prev) => [...prev, ...placeholders]);

    try {
      for (const rootHash of toAdd) {
        const file = files.find((f) => f.rootHash === rootHash);
        if (!file) {
          setAttachments((prev) =>
            prev.map((a) =>
              a.rootHash === rootHash ? { ...a, status: "error" as const } : a
            )
          );
          continue;
        }

        const [pack] = await loadEvidenceForFiles({
          files: [file],
          rootHashes: [rootHash],
          fetchContent: fetchFileContent,
        });

        setAttachments((prev) =>
          prev.map((a) =>
            a.rootHash === rootHash
              ? {
                  ...a,
                  evidence: pack ?? null,
                  status: pack ? ("ready" as const) : ("error" as const),
                }
              : a
          )
        );

        if (!pack) {
          toast.error(
            `${vaultFileLabel(file)} couldn't be read — try Insights first`
          );
        }
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to load vault files");
      setAttachments((prev) =>
        prev.map((a) =>
          toAdd.includes(a.rootHash) ? { ...a, status: "error" as const } : a
        )
      );
    }
  };

  const attachFromDevice = async (fileList: FileList | File[]) => {
    if (!isConnected) {
      toast.error("Connect wallet to attach files");
      return;
    }

    for (const file of Array.from(fileList)) {
      const id = `device_${Date.now()}_${file.name}`;
      setAttachments((prev) => [
        ...prev,
        {
          id,
          label: file.name,
          source: "device",
          rootHash: "",
          evidence: null,
          status: "uploading",
        },
      ]);

      try {
        let uploadFile = file;
        let category = "unassigned";
        const lower = file.name.toLowerCase();
        const canNormalize =
          lower.endsWith(".txt") ||
          lower.endsWith(".csv") ||
          lower.endsWith(".json") ||
          file.type.startsWith("text") ||
          file.type === "application/json";

        if (canNormalize) {
          try {
            const content = await file.text();
            if (content.trim()) {
              const pack = normalizeFromFileContent(file.name, content, {
                wallet: address,
                chainId,
                source: "upload",
              });
              uploadFile = evidenceToFile(pack);
              category = evidenceCategory(pack.type);
            }
          } catch {
            /* keep raw file */
          }
        }

        const result = await uploadAndRegisterOnVault(
          uploadFile,
          addFile,
          (rootHash) => rootHash,
          { category, useTestnet: true }
        );

        if (!result) {
          setAttachments((prev) =>
            prev.map((a) => (a.id === id ? { ...a, status: "error" } : a))
          );
          continue;
        }

        await onVaultChange?.();
        const synced = await loadEvidenceForFiles({
          files: [
            ...files,
            {
              rootHash: result.rootHash,
              category,
              insightsCID: result.rootHash,
              timestamp: Math.floor(Date.now() / 1000),
            },
          ],
          rootHashes: [result.rootHash],
          fetchContent: fetchFileContent,
        });

        const evidence = synced[0] ?? null;
        setAttachments((prev) =>
          prev.map((a) =>
            a.id === id
              ? {
                  ...a,
                  rootHash: result.rootHash,
                  evidence,
                  status: evidence ? "ready" : "error",
                }
              : a
          )
        );

        if (!evidence) {
          toast.info(`${file.name} saved to vault — run Insights to use in chat`);
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
        setAttachments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: "error" } : a))
        );
      }
    }
  };

  return {
    attachments,
    uploading,
    readyEvidence,
    deviceInputRef,
    removeAttachment,
    clearAttachments,
    attachFromVault,
    attachFromDevice,
  };
}

export function AttachmentChip({
  attachment,
  onRemove,
}: {
  attachment: ChatAttachment;
  onRemove: () => void;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-[12rem] items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
        attachment.status === "error"
          ? "border-destructive/40 bg-destructive/5 text-destructive"
          : "border-border/60 bg-muted/40 text-foreground"
      )}
    >
      {attachment.status === "uploading" ? (
        <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
      ) : (
        <FileText className="h-3 w-3 shrink-0 opacity-70" />
      )}
      <span className="truncate">{attachment.label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="rounded-full p-0.5 hover:bg-muted"
        aria-label={`Remove ${attachment.label}`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

export function ChatAttachmentControls({
  files,
  attachments,
  uploading,
  disabled,
  deviceInputRef,
  onDeviceSelect,
  onVaultAttach,
}: {
  files: VaultFile[];
  attachments: ChatAttachment[];
  uploading: boolean;
  disabled?: boolean;
  deviceInputRef: React.RefObject<HTMLInputElement | null>;
  onDeviceSelect: (files: FileList) => void;
  onVaultAttach: (rootHashes: string[]) => void;
}) {
  const [vaultOpen, setVaultOpen] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const sortedFiles = useMemo(
    () => [...files].sort((a, b) => b.timestamp - a.timestamp),
    [files]
  );

  const togglePick = (rootHash: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(rootHash)) next.delete(rootHash);
      else next.add(rootHash);
      return next;
    });
  };

  const attachedHashes = new Set(
    attachments.filter((a) => a.status !== "error").map((a) => a.rootHash)
  );

  return (
    <>
      <input
        ref={deviceInputRef}
        type="file"
        multiple
        className="hidden"
        accept=".pdf,.txt,.csv,.json,.png,.jpg,.jpeg,.doc,.docx"
        onChange={(e) => {
          if (e.target.files?.length) onDeviceSelect(e.target.files);
          e.target.value = "";
        }}
      />

      <button
        type="button"
        disabled={disabled || uploading}
        onClick={() => deviceInputRef.current?.click()}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-medium transition-colors",
          disabled
            ? "text-muted-foreground opacity-50"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
        title="Upload from device"
      >
        {uploading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Paperclip className="h-3.5 w-3.5" />
        )}
        Attach
      </button>

      <Popover
        open={vaultOpen}
        onOpenChange={(open) => {
          setVaultOpen(open);
          if (!open) setPicked(new Set());
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled || !files.length}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-medium transition-colors",
              disabled || !files.length
                ? "text-muted-foreground opacity-50"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <FolderOpen className="h-3.5 w-3.5" />
            Vault
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 p-0">
          <div className="border-b px-3 py-2.5">
            <p className="text-sm font-semibold">From vault</p>
            <p className="text-[11px] text-muted-foreground">
              Pick files to include with your question
            </p>
          </div>
          <div className="brand-scroll max-h-56 overflow-y-auto p-2">
            {!sortedFiles.length ? (
              <p className="px-2 py-4 text-center text-xs text-muted-foreground">
                No vault files yet
              </p>
            ) : (
              <ul className="space-y-1">
                {sortedFiles.map((file) => {
                  const label = vaultFileLabel(file);
                  const already = attachedHashes.has(file.rootHash);
                  return (
                    <li key={file.rootHash}>
                      <label
                        className={cn(
                          "flex cursor-pointer items-center gap-2.5 rounded-xl px-2 py-2 hover:bg-muted/60",
                          already && "opacity-50"
                        )}
                      >
                        <Checkbox
                          checked={picked.has(file.rootHash)}
                          disabled={already}
                          onCheckedChange={() => togglePick(file.rootHash)}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium">{label}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(file.timestamp * 1000).toLocaleDateString()}
                          </p>
                        </div>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="flex justify-end gap-2 border-t px-3 py-2.5">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 rounded-full text-xs"
              onClick={() => setVaultOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-8 rounded-full text-xs"
              disabled={picked.size === 0}
              onClick={() => {
                onVaultAttach([...picked]);
                setVaultOpen(false);
                setPicked(new Set());
              }}
            >
              Attach {picked.size > 0 ? `(${picked.size})` : ""}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
