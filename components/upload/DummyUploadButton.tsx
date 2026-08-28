"use client";

import { useAccount, useChainId } from "wagmi";
import { DUMMY_CONTENTS } from "@/utils/upload";
import { useAddToVault } from "@/hooks/useAddToVault";
import { Button } from "@/components/ui/button";
import { FileStack } from "lucide-react";
import type { UploadProgressState } from "./UploadButton";
import {
  evidenceToFile,
  normalizeTextEvidence,
  registerEvidencePack,
} from "@/lib/evidence";

export default function DummyUploadButton({
  onUpload,
  loading,
  setLoading,
  onProgress,
  onComplete,
}: {
  onUpload: (files: { file: File; rootHash: string; txHash?: string }[]) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
  onProgress?: (progress: UploadProgressState | null) => void;
  onComplete?: () => void;
}) {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { addFile } = useAddToVault();

  const handleDummyUpload = async () => {
    if (!isConnected) return;

    setLoading(true);
    const uploaded: { file: File; rootHash: string; txHash?: string }[] = [];

    for (let i = 0; i < DUMMY_CONTENTS.length; i++) {
      const content = DUMMY_CONTENTS[i];
      const pack = normalizeTextEvidence(content, {
        source: "sample",
        fileName: `sample_receipt_${i + 1}.txt`,
        type: "spend",
        wallet: address,
        chainId,
      });
      const file = evidenceToFile(pack);

      onProgress?.({
        current: i + 1,
        total: DUMMY_CONTENTS.length,
        fileName: pack.title,
        phase: "storage",
      });

      const result = await registerEvidencePack(pack, addFile, {
        onProgress: (phase) =>
          onProgress?.({
            current: i + 1,
            total: DUMMY_CONTENTS.length,
            fileName: pack.title,
            phase,
          }),
      });

      if (!result) continue;
      uploaded.push({
        file,
        rootHash: result.rootHash,
        txHash: result.txHash,
      });
    }

    onProgress?.(null);
    onUpload(uploaded);
    setLoading(false);
    if (uploaded.length > 0) onComplete?.();
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={handleDummyUpload}
      disabled={loading || !isConnected}
    >
      <FileStack className="h-4 w-4" />
      {!isConnected
        ? "Connect wallet first"
        : loading
        ? "Uploading sample…"
        : "Try sample receipt"}
    </Button>
  );
}
