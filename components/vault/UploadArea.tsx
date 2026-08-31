"use client";

import { useState, useCallback } from "react";
import { useAccount, useChainId } from "wagmi";
import UploadButton, { type UploadProgressState } from "../upload/UploadButton";
import DummyUploadButton from "../upload/DummyUploadButton";
import EvidenceIntake from "./EvidenceIntake";
import { Progress } from "@/components/ui/progress";
import { ExplorerLink } from "./ExplorerLink";
import { CopyHash } from "./CopyHash";
import { CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTxExplorerUrl, truncateHash } from "@/lib/explorer";
import { Panel, PanelHeader } from "@/components/ui/panel";

interface UploadedFile {
  file: File;
  rootHash: string;
  txHash?: string;
  content?: string;
}

function phaseLabel(phase: UploadProgressState["phase"]) {
  if (phase === "storage") return "Uploading to 0G Storage…";
  if (phase === "vault") return "Confirm in wallet…";
  return "Finishing…";
}

export default function UploadArea({
  onVaultUpdate,
}: {
  onVaultUpdate?: () => void;
}) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadProgress, setUploadProgress] =
    useState<UploadProgressState | null>(null);

  const handleVaultUpdate = useCallback(() => {
    onVaultUpdate?.();
  }, [onVaultUpdate]);

  const handleUpload = async (
    files: { file: File; rootHash?: string; txHash?: string }[]
  ) => {
    const filesWithContent = await Promise.all(
      files.map(async (file) => ({
        ...file,
        rootHash: file.rootHash!,
        content:
          file.file.type.startsWith("text") ||
          file.file.type === "application/json"
            ? await file.file.text()
            : undefined,
      }))
    );
    setUploadedFiles((prev) => [...prev, ...filesWithContent]);
  };

  const progressPercent = uploadProgress
    ? Math.round(
        ((uploadProgress.current - 1) +
          (uploadProgress.phase === "vault" ? 0.55 : 0.25)) /
          uploadProgress.total *
          100
      )
    : 0;

  return (
    <div className="space-y-3">
      <EvidenceIntake
        disabled={loading}
        onRegistered={(result) => {
          const file = new File(
            [JSON.stringify(result.pack, null, 2)],
            `${result.pack.id}.json`,
            { type: "application/json" }
          );
          setUploadedFiles((prev) => [
            ...prev,
            { file, rootHash: result.rootHash, txHash: result.txHash },
          ]);
          handleVaultUpdate();
        }}
      />

      <Panel>
        <PanelHeader
          title="File upload"
          hint="Text/CSV/JSON auto-normalize to evidence packs. Other types store as-is."
          action={
            <DummyUploadButton
              onUpload={handleUpload}
              loading={loading}
              setLoading={setLoading}
              onProgress={setUploadProgress}
              onComplete={handleVaultUpdate}
            />
          }
        />
        {!isConnected && (
          <p className="mb-3 text-xs text-muted-foreground">
            Connect wallet to upload.
          </p>
        )}
        <UploadButton
          onUpload={handleUpload}
          loading={loading}
          setLoading={setLoading}
          onProgress={setUploadProgress}
          onComplete={handleVaultUpdate}
        />
      </Panel>

      {uploadedFiles.length > 0 && (
        <Panel pad={false}>
          <div className="flex items-center justify-between px-5 py-3">
            <p className="text-sm font-medium">
              Session · {uploadedFiles.length}
            </p>
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          </div>
          {loading && uploadProgress && (
            <div className="px-5 pb-3 space-y-1.5">
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span className="truncate">{uploadProgress.fileName}</span>
                <span>
                  {uploadProgress.current}/{uploadProgress.total}
                </span>
              </div>
              <Progress value={progressPercent} className="h-1" />
              <p className="text-[11px] text-muted-foreground">
                {phaseLabel(uploadProgress.phase)}
              </p>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="px-5 py-2 font-medium">Name</th>
                  <th className="px-5 py-2 font-medium">Storage</th>
                  <th className="px-5 py-2 font-medium">Tx</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {uploadedFiles.map((file, index) => (
                  <tr key={index}>
                    <td className="px-5 py-2.5 font-medium">{file.file.name}</td>
                    <td className="px-5 py-2.5">
                      <CopyHash hash={file.rootHash} />
                    </td>
                    <td className="px-5 py-2.5">
                      {file.txHash ? (
                        <ExplorerLink
                          href={getTxExplorerUrl(chainId, file.txHash)}
                          label={truncateHash(file.txHash)}
                        />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-2.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1",
                          file.txHash
                            ? "text-[var(--success)]"
                            : "text-amber-500"
                        )}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        {file.txHash ? "On-chain" : "Stored"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}
