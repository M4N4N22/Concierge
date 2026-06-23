"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileText, X, CloudUpload } from "lucide-react";
import { useAccount, useChainId } from "wagmi";
import { uploadAndRegisterOnVault } from "@/utils/upload";
import { useAddToVault } from "@/hooks/useAddToVault";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type UploadedFile = {
  file: File;
  rootHash?: string;
  txHash?: string;
};

export type UploadProgressState = {
  current: number;
  total: number;
  fileName: string;
  phase: "storage" | "vault" | "done";
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function phaseLabel(phase: UploadProgressState["phase"]) {
  if (phase === "storage") return "Uploading to 0G Storage…";
  if (phase === "vault") return "Confirm transaction in wallet…";
  return "Finishing…";
}

export default function UploadButton({
  onUpload,
  loading,
  setLoading,
  onProgress,
  onComplete,
}: {
  onUpload: (files: UploadedFile[]) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
  onProgress?: (progress: UploadProgressState | null) => void;
  onComplete?: () => void;
}) {
  const { isConnected } = useAccount();
  const { addFile } = useAddToVault();
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressState | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateProgress = useCallback(
    (p: UploadProgressState | null) => {
      setUploadProgress(p);
      onProgress?.(p);
    },
    [onProgress]
  );

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const next = Array.from(incoming);
    setStagedFiles((prev) => {
      const names = new Set(prev.map((f) => f.name + f.size));
      return [...prev, ...next.filter((f) => !names.has(f.name + f.size))];
    });
  }, []);

  const removeFile = (index: number) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const handleUpload = async () => {
    if (!isConnected || stagedFiles.length === 0) return;

    setLoading(true);
    const uploaded: UploadedFile[] = [];
    const total = stagedFiles.length;

    for (let i = 0; i < stagedFiles.length; i++) {
      const file = stagedFiles[i];
      updateProgress({
        current: i + 1,
        total,
        fileName: file.name,
        phase: "storage",
      });

      const result = await uploadAndRegisterOnVault(
        file,
        addFile,
        (rootHash) => rootHash,
        {
          onProgress: (phase) =>
            updateProgress({
              current: i + 1,
              total,
              fileName: file.name,
              phase,
            }),
        }
      );

      if (result) {
        uploaded.push({
          file,
          rootHash: result.rootHash,
          txHash: result.txHash,
        });
      }
    }

    updateProgress(null);
    onUpload(uploaded);
    setStagedFiles([]);
    setLoading(false);
    if (uploaded.length > 0) onComplete?.();
  };

  const disabled = !isConnected || loading;
  const progressPercent = uploadProgress
    ? Math.round(
        ((uploadProgress.current - 1) +
          (uploadProgress.phase === "vault" ? 0.55 : uploadProgress.phase === "done" ? 1 : 0.25)) /
          uploadProgress.total *
          100
      )
    : 0;

  return (
    <div className="space-y-4">
      {uploadProgress && (
        <div className="rounded-xl border bg-muted/20 px-4 py-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium truncate pr-4">
              {uploadProgress.fileName}
            </span>
            <span className="text-muted-foreground shrink-0 text-xs">
              {uploadProgress.current} of {uploadProgress.total}
            </span>
          </div>
          <Progress value={progressPercent} className="h-1.5" />
          <p className="text-xs text-muted-foreground">
            {phaseLabel(uploadProgress.phase)}
          </p>
        </div>
      )}

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) inputRef.current?.click();
        }}
        onDrop={disabled ? undefined : handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-all",
          disabled
            ? "cursor-not-allowed border-border/60 bg-muted/20 opacity-60"
            : "cursor-pointer border-border hover:border-primary/50 hover:bg-primary/[0.02]",
          isDragging && "border-primary bg-primary/[0.05] scale-[1.005]"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleChange}
          disabled={disabled}
          accept=".pdf,.txt,.csv,.json,.png,.jpg,.jpeg,.doc,.docx"
        />

        <div
          className={cn(
            "mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-colors",
            isDragging ? "bg-primary/15 text-primary" : "bg-muted/60 text-muted-foreground"
          )}
        >
          {isDragging ? (
            <CloudUpload className="h-8 w-8" />
          ) : (
            <Upload className="h-8 w-8" />
          )}
        </div>

        <p className="text-base font-medium text-foreground">
          {!isConnected
            ? "Connect your wallet to upload"
            : loading
            ? "Uploading to 0G…"
            : isDragging
            ? "Drop files to add to your vault"
            : "Drag files here or click to browse"}
        </p>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          {isConnected
            ? "Receipts, bills, exports — encrypted on 0G Storage, registered on-chain"
            : "Your wallet signs storage & vault transactions"}
        </p>

        {isConnected && !loading && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-5 pointer-events-none"
            tabIndex={-1}
          >
            Select files
          </Button>
        )}
      </div>

      {stagedFiles.length > 0 && (
        <div className="overflow-hidden rounded-xl border bg-background">
          <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2.5">
            <p className="text-sm font-medium">
              {stagedFiles.length} file{stagedFiles.length !== 1 ? "s" : ""} ready
            </p>
            <button
              type="button"
              onClick={() => setStagedFiles([])}
              className="text-xs text-muted-foreground hover:text-foreground"
              disabled={loading}
            >
              Clear all
            </button>
          </div>

          <ul className="max-h-52 divide-y overflow-y-auto">
            {stagedFiles.map((file, i) => (
              <li
                key={`${file.name}-${file.size}-${i}`}
                className="flex items-center gap-3 px-4 py-2.5"
              >
                <FileText className="h-4 w-4 shrink-0 text-primary/70" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(i);
                  }}
                  className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  disabled={loading}
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>

          <div className="border-t bg-muted/20 px-4 py-3">
            <Button
              type="button"
              className="w-full"
              onClick={handleUpload}
              disabled={loading || !isConnected}
            >
              {loading
                ? "Uploading to 0G Storage & vault…"
                : `Upload ${stagedFiles.length} file${stagedFiles.length !== 1 ? "s" : ""} to vault`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
