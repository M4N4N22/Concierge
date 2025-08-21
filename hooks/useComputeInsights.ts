// hooks/useComputeInsights.ts
import { useState } from "react";

export function useComputeInsights() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const computeInsights = async (rootHash: string, fileName: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/computeInsights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rootHash, fileName }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to compute insights");
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { computeInsights, loading, error };
}
