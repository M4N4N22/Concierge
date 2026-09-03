"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAccount, useChainId } from "wagmi";
import { toast } from "sonner";
import { useComputeLedgerContext } from "@/components/vault/ComputeLedgerContext";
import { useAddToVault } from "@/hooks/useAddToVault";
import { usefetchFileContent } from "@/hooks/useFileContent";
import {
  ComputeInsightsError,
  runInsightsJob,
} from "@/lib/vault/runInsightsJob";
import {
  type IndexJobState,
  type IndexQueueItem,
  isFundError,
  loadAutoIndexPref,
  loadIndexPaused,
  loadIndexQueue,
  saveAutoIndexPref,
  saveIndexPaused,
  saveIndexQueue,
  shouldSkipAutoIndex,
  truncateForIndex,
} from "@/lib/vault/autoIndex";

type EnqueueInput = {
  rootHash: string;
  fileName: string;
  category?: string;
};

type AutoIndexContextValue = {
  autoReadEnabled: boolean;
  paused: boolean;
  pendingCount: number;
  jobStates: Record<string, IndexJobState>;
  setAutoReadEnabled: (enabled: boolean) => void;
  enqueueIndex: (item: EnqueueInput) => void;
  resumeQueue: () => void;
  processing: boolean;
};

const AutoIndexContext = createContext<AutoIndexContextValue | null>(null);

export function AutoIndexProvider({
  children,
  onIndexed,
}: {
  children: React.ReactNode;
  onIndexed?: () => void;
}) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { readiness } = useComputeLedgerContext();
  const { updateInsights } = useAddToVault();
  const { fetchFileContent } = usefetchFileContent();
  const [autoReadEnabled, setAutoReadEnabledState] = useState(false);
  const [paused, setPaused] = useState(false);
  const [queue, setQueue] = useState<IndexQueueItem[]>([]);
  const [jobStates, setJobStates] = useState<Record<string, IndexJobState>>({});
  const [processing, setProcessing] = useState(false);
  const processingRef = useRef(false);
  const pausedNotifiedRef = useRef(false);
  const autoReadEnabledRef = useRef(false);

  useEffect(() => {
    autoReadEnabledRef.current = autoReadEnabled;
  }, [autoReadEnabled]);

  useEffect(() => {
    if (!address) {
      setAutoReadEnabledState(false);
      setQueue([]);
      setPaused(false);
      return;
    }
    const saved = loadAutoIndexPref(address);
    // Default ON once the user has funded compute (Drive-like: upload → Concierge learns).
    // Explicit off is respected until they turn it back on.
    const enabled = saved === null ? readiness.canCompute : saved;
    autoReadEnabledRef.current = enabled;
    setAutoReadEnabledState(enabled);
    setQueue(loadIndexQueue(address));
    setPaused(loadIndexPaused(address));
  }, [address, readiness.canCompute]);

  /** First time compute becomes ready and user never opted out → enable auto-read. */
  useEffect(() => {
    if (!address || !isConnected) return;
    if (!readiness.canCompute) return;
    if (loadAutoIndexPref(address) !== null) return;
    saveAutoIndexPref(address, true);
    autoReadEnabledRef.current = true;
    setAutoReadEnabledState(true);
  }, [address, isConnected, readiness.canCompute]);

  const persistQueue = useCallback(
    (next: IndexQueueItem[]) => {
      if (!address) return;
      saveIndexQueue(address, next);
      setQueue(next);
    },
    [address]
  );

  const setAutoReadEnabled = useCallback(
    (enabled: boolean) => {
      if (!address) return;
      saveAutoIndexPref(address, enabled);
      autoReadEnabledRef.current = enabled;
      setAutoReadEnabledState(enabled);
      if (enabled) {
        setPaused(false);
        saveIndexPaused(address, false);
        pausedNotifiedRef.current = false;
      }
    },
    [address]
  );

  const setPausedState = useCallback(
    (next: boolean, notify?: boolean) => {
      if (!address) return;
      saveIndexPaused(address, next);
      setPaused(next);
      if (next && notify && !pausedNotifiedRef.current) {
        pausedNotifiedRef.current = true;
        toast.warning(
          "Auto-read paused — add OG to your compute ledger. Uploads still save.",
          { duration: 6000 }
        );
      }
      if (!next) pausedNotifiedRef.current = false;
    },
    [address]
  );

  const enqueueIndex = useCallback(
    (item: EnqueueInput) => {
      if (!address || !autoReadEnabledRef.current) return;
      const category = item.category ?? "unassigned";
      if (shouldSkipAutoIndex(category)) return;

      setQueue((prev) => {
        if (prev.some((q) => q.rootHash === item.rootHash)) return prev;
        const next: IndexQueueItem = {
          rootHash: item.rootHash,
          fileName: item.fileName,
          category,
          enqueuedAt: new Date().toISOString(),
        };
        const merged = [...prev, next];
        saveIndexQueue(address, merged);
        return merged;
      });
      setJobStates((s) => ({ ...s, [item.rootHash]: "queued" }));
    },
    [address]
  );

  const processQueue = useCallback(async () => {
    if (
      !address ||
      !autoReadEnabled ||
      !readiness.canCompute ||
      processingRef.current ||
      queue.length === 0
    ) {
      return;
    }

    processingRef.current = true;
    setProcessing(true);

    let remaining = [...queue];
    let hitFundError = false;

    for (const item of queue) {
      if (hitFundError) break;
      if (!readiness.canCompute) break;

      setJobStates((s) => ({ ...s, [item.rootHash]: "running" }));

      try {
        const content = truncateForIndex(await fetchFileContent(item.rootHash));
        if (!content.trim() || content.includes("File not found")) {
          throw new Error("File content not available for indexing yet");
        }

        await runInsightsJob(
          {
            rootHash: item.rootHash,
            fileName: item.fileName,
            content,
            chainId,
            wallet: address,
          },
          updateInsights
        );
        remaining = remaining.filter((q) => q.rootHash !== item.rootHash);
        persistQueue(remaining);
        setJobStates((s) => {
          const next = { ...s };
          delete next[item.rootHash];
          return next;
        });
        onIndexed?.();
        toast.success(`Indexed: ${item.fileName}`, { duration: 2500 });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Indexing failed";
        const code =
          err instanceof ComputeInsightsError ? err.code : undefined;
        if (isFundError(message, code)) {
          hitFundError = true;
          setPausedState(true, true);
          setJobStates((s) => ({ ...s, [item.rootHash]: "queued" }));
          break;
        }
        setJobStates((s) => ({ ...s, [item.rootHash]: "failed" }));
        remaining = remaining.filter((q) => q.rootHash !== item.rootHash);
        persistQueue(remaining);
        toast.error(`Could not index ${item.fileName}: ${message}`);
      }
    }

    processingRef.current = false;
    setProcessing(false);
  }, [
    address,
    autoReadEnabled,
    chainId,
    fetchFileContent,
    onIndexed,
    persistQueue,
    queue,
    readiness.canCompute,
    setPausedState,
    updateInsights,
  ]);

  const resumeQueue = useCallback(() => {
    if (!address) return;
    setPausedState(false);
    pausedNotifiedRef.current = false;
    void processQueue();
  }, [address, processQueue, setPausedState]);

  useEffect(() => {
    if (autoReadEnabled && readiness.canCompute && !paused && queue.length > 0) {
      void processQueue();
    }
  }, [autoReadEnabled, paused, queue.length, readiness.canCompute, processQueue]);

  const value = useMemo(
    (): AutoIndexContextValue => ({
      autoReadEnabled,
      paused,
      pendingCount: queue.length,
      jobStates,
      setAutoReadEnabled,
      enqueueIndex,
      resumeQueue,
      processing,
    }),
    [
      autoReadEnabled,
      enqueueIndex,
      jobStates,
      paused,
      processing,
      queue.length,
      resumeQueue,
      setAutoReadEnabled,
    ]
  );

  return (
    <AutoIndexContext.Provider value={value}>
      {children}
    </AutoIndexContext.Provider>
  );
}

export function useAutoIndex(): AutoIndexContextValue {
  const ctx = useContext(AutoIndexContext);
  if (!ctx) {
    throw new Error("useAutoIndex must be used within AutoIndexProvider");
  }
  return ctx;
}
