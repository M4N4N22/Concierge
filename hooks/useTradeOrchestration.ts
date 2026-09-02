"use client";

import { useCallback, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { boardAuthMessage } from "@/lib/boardAuthMessage";
import {
  TRADE_SUGGEST_QUESTION,
  type BalanceSnapshot,
} from "@/lib/trade/suggest";
import type {
  ExecutionGate,
  TradeConsensus,
} from "@/lib/trade/orchestrator";
import type {
  TradeMandate,
  TradeMemoryRecord,
  TradeProposal,
  TradeSuggestion,
} from "@/lib/trade";
import {
  isWatcherSessionValid,
  loadWatcherSession,
  watcherAuthMessage,
  type WatcherSession,
} from "@/lib/trade/watcherAuth";
import { useAgenticId } from "@/hooks/useAgenticId";
import { useTradeMemory } from "@/hooks/useTradeMemory";
import type { ComputeErrorCode } from "@/lib/computeErrors";
import { toast } from "sonner";

export type TradeOrchestration = {
  gate: ExecutionGate;
  reasons: string[];
  consensus: TradeConsensus;
  proposal: TradeProposal;
  suggestion: TradeSuggestion;
  sessionId: string;
  computeMode: string;
  guardStatus?: string;
};

export type OrchestrationRunResult = {
  orchestration: TradeOrchestration;
  memoryRecord?: TradeMemoryRecord;
  memoryRootHash?: string;
};

export type OrchestrationError = {
  code?: ComputeErrorCode | string;
  title: string;
  message: string;
  detail?: string;
  action?: string;
};

type RunOptions = {
  balances: BalanceSnapshot;
  mandate: TradeMandate;
  auth?: "board" | "watcher";
  watcherSession?: WatcherSession | null;
  silent?: boolean;
};

export function useTradeOrchestration() {
  const { address, chainId, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { agent } = useAgenticId();
  const { persistTradeMemory } = useTradeMemory();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<OrchestrationError | null>(null);

  const runOrchestration = useCallback(
    async (options: RunOptions): Promise<OrchestrationRunResult | null> => {
      if (!isConnected || !address) {
        if (!options.silent) toast.error("Connect wallet");
        return null;
      }

      setRunning(true);
      setError(null);

      try {
        let body: Record<string, unknown> = {
          wallet: address,
          mode: "fast",
          question: TRADE_SUGGEST_QUESTION,
          balances: options.balances,
          mandate: options.mandate,
          maxNotional: options.mandate.maxNotional,
          chainId,
          agentTokenId: agent?.tokenId.toString(),
        };

        if (options.auth === "watcher") {
          const session =
            options.watcherSession ?? loadWatcherSession();
          if (!isWatcherSessionValid(session, address)) {
            throw new Error("Watcher session expired — re-enable the watcher");
          }
          body = {
            ...body,
            watcherAuth: true,
            issuedAt: session!.issuedAt,
            expiresAt: session!.expiresAt,
            signature: session!.signature,
          };
        } else {
          const timestamp = Date.now();
          const message = boardAuthMessage({
            wallet: address,
            timestamp,
            question: TRADE_SUGGEST_QUESTION,
          });
          const signature = await signMessageAsync({ message });
          body = { ...body, timestamp, signature };
        }

        const res = await fetch("/api/tradeOrchestrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();

        if (!res.ok) {
          const err: OrchestrationError = {
            code: (data.code as string) || "UNKNOWN",
            title: (data.title as string) || "0G Compute unavailable",
            message: (data.error as string) || "Orchestration failed",
            detail: data.detail as string | undefined,
            action: data.action as string | undefined,
          };
          setError(err);
          if (!options.silent) toast.error(err.title);
          return null;
        }

        const orchestration = data.orchestration as TradeOrchestration;
        const memoryRecord = data.memory?.record as
          | TradeMemoryRecord
          | undefined;

        let memoryRootHash: string | undefined;
        if (memoryRecord) {
          const saved = await persistTradeMemory(memoryRecord, chainId);
          memoryRootHash = saved?.rootHash;
        }

        if (!options.silent) {
          toast.success("Agent orchestration complete");
        }

        return { orchestration, memoryRecord, memoryRootHash };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Orchestration failed";
        const errState: OrchestrationError = {
          title: "Request failed",
          message,
        };
        setError(errState);
        if (!options.silent) toast.error(message);
        return null;
      } finally {
        setRunning(false);
      }
    },
    [
      address,
      agent?.tokenId,
      chainId,
      isConnected,
      persistTradeMemory,
      signMessageAsync,
    ]
  );

  const signWatcherSession = useCallback(async (): Promise<WatcherSession | null> => {
    if (!address) return null;
    const issuedAt = Date.now();
    const expiresAt = issuedAt + 24 * 60 * 60 * 1000;
    const message = watcherAuthMessage({ wallet: address, issuedAt, expiresAt });
    const signature = (await signMessageAsync({ message })) as `0x${string}`;
    return { wallet: address, issuedAt, expiresAt, signature };
  }, [address, signMessageAsync]);

  return {
    running,
    error,
    setError,
    runOrchestration,
    signWatcherSession,
  };
}
