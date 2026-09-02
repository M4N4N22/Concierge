"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { evidenceCategory } from "@/lib/evidence";
import { type TradeMemoryRecord } from "@/lib/trade/memory";
import { uploadAndRegisterOnVault } from "@/utils/upload";
import { useAddToVault } from "@/hooks/useAddToVault";
import { useAgenticId } from "@/hooks/useAgenticId";

/** Upload trade decision memory to 0G Storage + vault; link to Agentic ID when owned. */
export function useTradeMemory() {
  const { addFile } = useAddToVault();
  const { agent, bindTradeMemory } = useAgenticId();

  const persistTradeMemory = useCallback(
    async (
      record: TradeMemoryRecord,
      chainId?: number
    ): Promise<{ rootHash: string; txHash?: string } | null> => {
      const file = new File(
        [JSON.stringify(record, null, 2)],
        `trade-memory-${record.proposalId}.json`,
        { type: "application/json" }
      );

      const toastId = toast.loading("Saving trade decision to vault…");
      const result = await uploadAndRegisterOnVault(
        file,
        addFile,
        (rootHash) => rootHash,
        {
          category: evidenceCategory("trade"),
          useTestnet: (chainId ?? 16602) === 16602,
          toastId,
          successMessage: "Trade decision saved to vault",
        }
      );

      if (!result) return null;

      if (agent?.access === "owner") {
        try {
          await bindTradeMemory({
            tokenId: agent.tokenId,
            memoryRootHash: result.rootHash,
            guardSealHash: record.guardSealHash,
          });
          toast.success("Linked to Agentic ID", { id: toastId });
        } catch {
          toast.success("Trade decision saved to vault", { id: toastId });
        }
      }

      return result;
    },
    [addFile, agent, bindTradeMemory]
  );

  return { persistTradeMemory };
}
