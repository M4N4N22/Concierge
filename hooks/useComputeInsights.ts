import { useState } from "react";
import { useChainId } from "wagmi";
import { useAddToVault } from "@/hooks/useAddToVault";
import { runInsightsJob } from "@/lib/vault/runInsightsJob";

export function useComputeInsights() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chainId = useChainId();
  const { updateInsights } = useAddToVault();

  const computeInsights = async (
    rootHash: string,
    fileName: string,
    content: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      return await runInsightsJob(
        { rootHash, fileName, content, chainId },
        updateInsights
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to compute insights";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { computeInsights, loading, error };
}
