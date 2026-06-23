"use client";

import { useAccount } from "wagmi";
import { DUMMY_CONTENTS, uploadAndRegisterOnVault } from "@/utils/upload";
import { useAddToVault } from "@/hooks/useAddToVault";
import { Button } from "@/components/ui/button";
import { FileStack } from "lucide-react";
import type { UploadProgressState } from "./UploadButton";

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
  const { isConnected } = useAccount();
  const { addFile } = useAddToVault();
  const emptyBytes32 = "0x" + "00".repeat(32);

  const handleDummyUpload = async () => {
    if (!isConnected) return;

    setLoading(true);
    const uploaded: { file: File; rootHash: string; txHash?: string }[] = [];

    for (let i = 0; i < DUMMY_CONTENTS.length; i++) {
      const content = DUMMY_CONTENTS[i];
      const file = new File([content], `sample_receipt_${i + 1}.txt`, {
        type: "text/plain",
      });

      onProgress?.({
        current: i + 1,
        total: DUMMY_CONTENTS.length,
        fileName: file.name,
        phase: "storage",
      });

      const result = await uploadAndRegisterOnVault(file, addFile, emptyBytes32, {
        onProgress: (phase) =>
          onProgress?.({
            current: i + 1,
            total: DUMMY_CONTENTS.length,
            fileName: file.name,
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
