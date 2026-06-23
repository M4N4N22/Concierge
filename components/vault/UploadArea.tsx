"use client";

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import UploadButton, { type UploadProgressState } from "../upload/UploadButton";
import DummyUploadButton from "../upload/DummyUploadButton";
import { Progress } from "@/components/ui/progress";
import { ExplorerLink } from "./ExplorerLink";
import { CopyHash } from "./CopyHash";
import {
  Shield,
  Link2,
  Wallet,
  HardDrive,
  Blocks,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChainId } from "wagmi";
import {
  getTxExplorerUrl,
  truncateHash,
} from "@/lib/explorer";

interface UploadedFile {
  file: File;
  rootHash: string;
  txHash?: string;
  content?: string;
}

const PIPELINE = [
  { icon: HardDrive, label: "Your device", detail: "Files you choose" },
  { icon: Shield, label: "0G Storage", detail: "Encrypted, decentralized" },
  { icon: Blocks, label: "0G Chain vault", detail: "On-chain registry" },
] as const;

const DIFFERENTIATORS = [
  {
    icon: Shield,
    title: "Encrypted at rest",
    body: "Files are stored on 0G Storage — not a centralized cloud bucket you don't control.",
  },
  {
    icon: Link2,
    title: "Provable on-chain",
    body: "Each file gets a Merkle root hash registered in your vault smart contract.",
  },
  {
    icon: Wallet,
    title: "Wallet-owned",
    body: "Only your connected wallet can add files. No account passwords — you hold the keys.",
  },
] as const;

function phaseLabel(phase: UploadProgressState["phase"]) {
  if (phase === "storage") return "Uploading to 0G Storage…";
  if (phase === "vault") return "Confirm transaction in wallet…";
  return "Finishing…";
}

export default function UploadArea({ onVaultUpdate }: { onVaultUpdate?: () => void }) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressState | null>(null);

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
        content: file.file.type.startsWith("text")
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
    <div className="space-y-6">
      <section className="rounded-2xl border bg-card overflow-hidden">
        <div className="border-b bg-muted/30 px-5 py-3.5">
          <p className="text-sm font-medium">Where your data goes</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Unlike Google Drive or Dropbox — decentralized storage with on-chain proof
          </p>
        </div>
        <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
          {PIPELINE.map((step, i) => (
            <div key={step.label} className="flex items-start gap-3 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <step.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Step {i + 1}
                </p>
                <p className="text-sm font-semibold mt-0.5">{step.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{step.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Add to vault</h2>
            <p className="text-sm text-muted-foreground">
              Upload documents to your personal 0G vault
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
              0G Galileo testnet
            </span>
            <DummyUploadButton
              onUpload={handleUpload}
              loading={loading}
              setLoading={setLoading}
              onProgress={setUploadProgress}
              onComplete={handleVaultUpdate}
            />
          </div>
        </div>

        <div className="p-5">
          {!isConnected && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm">
              <Wallet className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Connect wallet</span> in the
                header to sign storage uploads and vault transactions on 0G.
              </p>
            </div>
          )}

          <UploadButton
            onUpload={handleUpload}
            loading={loading}
            setLoading={setLoading}
            onProgress={setUploadProgress}
            onComplete={handleVaultUpdate}
          />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {DIFFERENTIATORS.map((item) => (
          <div
            key={item.title}
            className="rounded-xl border bg-card/50 p-4 transition-colors hover:bg-card"
          >
            <item.icon className="h-5 w-5 text-primary mb-2.5" />
            <p className="text-sm font-semibold">{item.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.body}</p>
          </div>
        ))}
      </section>

      {uploadedFiles.length > 0 && (
        <section className="rounded-2xl border bg-card overflow-hidden">
          <div className="border-b bg-muted/30 px-5 py-3.5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Upload complete</p>
              <p className="text-xs text-muted-foreground">
                {uploadedFiles.length} file{uploadedFiles.length !== 1 ? "s" : ""} this session
              </p>
            </div>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </div>

          {loading && uploadProgress && (
            <div className="border-b px-5 py-3 space-y-2 bg-primary/[0.03]">
              <div className="flex justify-between text-xs">
                <span className="font-medium truncate">{uploadProgress.fileName}</span>
                <span className="text-muted-foreground shrink-0 ml-2">
                  {uploadProgress.current}/{uploadProgress.total}
                </span>
              </div>
              <Progress value={progressPercent} className="h-1.5" />
              <p className="text-xs text-muted-foreground">{phaseLabel(uploadProgress.phase)}</p>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-5 py-2.5 font-medium">Name</th>
                  <th className="px-5 py-2.5 font-medium">0G Storage</th>
                  <th className="px-5 py-2.5 font-medium">Vault tx</th>
                  <th className="px-5 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {uploadedFiles.map((file, index) => (
                  <tr key={index} className="hover:bg-muted/20">
                    <td className="px-5 py-3 font-medium">{file.file.name}</td>
                    <td className="px-5 py-3">
                      <CopyHash hash={file.rootHash} />
                    </td>
                    <td className="px-5 py-3">
                      {file.txHash ? (
                        <ExplorerLink
                          href={getTxExplorerUrl(chainId, file.txHash)}
                          label={truncateHash(file.txHash)}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-xs font-medium",
                          file.txHash
                            ? "text-green-600 dark:text-green-400"
                            : "text-amber-600"
                        )}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {file.txHash ? "On-chain" : "Stored"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
