"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import type { VaultFile } from "@/hooks/useUserFiles";
import { usefetchFileContent } from "@/hooks/useFileContent";

const SAMPLE_LIMIT = 24;

export function useVaultStorageEstimate(files: VaultFile[], enabled: boolean) {
  const { isConnected } = useAccount();
  const { fetchFileContent } = usefetchFileContent();
  const [bytes, setBytes] = useState<number | null>(null);
  const [sampled, setSampled] = useState(0);
  const [loading, setLoading] = useState(false);

  const estimate = useCallback(async () => {
    if (!enabled || !isConnected || files.length === 0) {
      setBytes(null);
      setSampled(0);
      return;
    }

    setLoading(true);
    const sample = [...files]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, SAMPLE_LIMIT);

    let total = 0;
    let count = 0;

    await Promise.all(
      sample.map(async (file) => {
        try {
          const text = await fetchFileContent(file.rootHash);
          total += new Blob([text]).size;
          count += 1;
        } catch {
          /* skip unavailable blobs */
        }
      })
    );

    if (count === 0) {
      setBytes(null);
      setSampled(0);
    } else if (count >= files.length) {
      setBytes(total);
      setSampled(count);
    } else {
      const avg = total / count;
      setBytes(Math.round(avg * files.length));
      setSampled(count);
    }
    setLoading(false);
  }, [enabled, fetchFileContent, files, isConnected]);

  useEffect(() => {
    void estimate();
  }, [estimate]);

  return { bytes, sampled, loading, totalFiles: files.length };
}
