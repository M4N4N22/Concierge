"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";
import type { BalanceSnapshot } from "@/lib/trade/suggest";
import type { TradeMandate } from "@/lib/trade/types";
import {
  canOrchestrateNow,
  detectPortfolioShift,
  loadWatcherConfig,
  previewHeuristicOnShift,
  saveWatcherConfig,
  snapshotFromBalances,
  type PortfolioSnapshot,
  type PortfolioWatcherConfig,
  type WatcherHeuristicPreview,
} from "@/lib/trade/watcher";
import {
  clearWatcherSession,
  isWatcherSessionValid,
  loadWatcherSession,
  saveWatcherSession,
  type WatcherSession,
} from "@/lib/trade/watcherAuth";
import {
  useTradeOrchestration,
  type OrchestrationRunResult,
} from "@/hooks/useTradeOrchestration";
import { toast } from "sonner";

export type WatcherStatus = {
  enabled: boolean;
  checking: boolean;
  orchestrating: boolean;
  sessionValid: boolean;
  lastCheckedAt?: string;
  lastTriggerReason?: string;
  pendingShift?: WatcherHeuristicPreview;
  config: PortfolioWatcherConfig;
};

type UsePortfolioWatcherArgs = {
  balances: BalanceSnapshot;
  mandate: TradeMandate;
  balLoading: boolean;
  refreshBalances: () => Promise<void> | void;
  onOrchestration?: (result: OrchestrationRunResult) => void;
};

export function usePortfolioWatcher({
  balances,
  mandate,
  balLoading,
  refreshBalances,
  onOrchestration,
}: UsePortfolioWatcherArgs) {
  const { address, isConnected } = useAccount();
  const { runOrchestration, signWatcherSession, running } =
    useTradeOrchestration();

  const [config, setConfig] = useState<PortfolioWatcherConfig>(
    loadWatcherConfig
  );
  const [session, setSession] = useState<WatcherSession | null>(null);
  const [pendingShift, setPendingShift] =
    useState<WatcherHeuristicPreview | null>(null);
  const [checking, setChecking] = useState(false);
  const lastSnapshotRef = useRef<PortfolioSnapshot | null>(null);
  const onOrchestrationRef = useRef(onOrchestration);
  onOrchestrationRef.current = onOrchestration;

  useEffect(() => {
    setSession(loadWatcherSession());
  }, [address]);

  const persistConfig = useCallback((next: PortfolioWatcherConfig) => {
    setConfig(next);
    saveWatcherConfig(next);
  }, []);

  const runCheck = useCallback(
    async (opts?: { forceOrchestrate?: boolean; reason?: string }) => {
      if (!isConnected || !address || balLoading) return;

      setChecking(true);
      const now = new Date().toISOString();
      const snapshot = snapshotFromBalances(balances);
      const shift = detectPortfolioShift(lastSnapshotRef.current, snapshot, {
        usdcDeltaMin: config.usdcDeltaMin,
        ogPctDeltaMin: config.ogPctDeltaMin,
      });

      lastSnapshotRef.current = snapshot;

      const nextConfig: PortfolioWatcherConfig = {
        ...config,
        lastCheckedAt: now,
      };

      const shouldOrchestrate =
        opts?.forceOrchestrate ||
        (shift.material && canOrchestrateNow(config));

      if (shift.material || opts?.forceOrchestrate) {
        const reason = opts?.reason ?? shift.reason ?? "Manual refresh";
        nextConfig.lastTriggerReason = reason;
        const preview = previewHeuristicOnShift(balances, mandate, shift);
        setPendingShift(preview);

        const sessionValid = isWatcherSessionValid(session, address);
        if (
          config.autoOrchestrate &&
          sessionValid &&
          shouldOrchestrate
        ) {
          const result = await runOrchestration({
            balances,
            mandate,
            auth: "watcher",
            watcherSession: session,
            silent: true,
          });
          if (result) {
            nextConfig.lastOrchestratedAt = new Date().toISOString();
            setPendingShift(null);
            onOrchestrationRef.current?.(result);
            toast.message("Watcher re-ran agents", {
              description: reason,
            });
          }
        } else if (shift.material && !opts?.forceOrchestrate) {
          toast.message("Portfolio shifted", {
            description: `${reason} — ${preview.suggestion.side.to ()} heuristic ready`,
          });
        }
      }

      persistConfig(nextConfig);
      setChecking(false);
    },
    [
      address,
      balances,
      balLoading,
      config,
      isConnected,
      mandate,
      persistConfig,
      runOrchestration,
      session,
    ]
  );

  const enableWatcher = useCallback(async () => {
    if (!isConnected || !address) {
      toast.error("Connect wallet first");
      return;
    }
    try {
      const signed = await signWatcherSession();
      if (!signed) return;
      saveWatcherSession(signed);
      setSession(signed);
      lastSnapshotRef.current = snapshotFromBalances(balances);
      persistConfig({
        ...config,
        enabled: true,
        lastCheckedAt: new Date().toISOString(),
      });
      toast.success("Portfolio watcher enabled (24h)");
    } catch {
      toast.error("Watcher authorization cancelled");
    }
  }, [
    address,
    balances,
    config,
    isConnected,
    persistConfig,
    signWatcherSession,
  ]);

  const disableWatcher = useCallback(() => {
    clearWatcherSession();
    setSession(null);
    setPendingShift(null);
    persistConfig({ ...config, enabled: false });
    toast.message("Portfolio watcher paused");
  }, [config, persistConfig]);

  const dismissPending = useCallback(() => setPendingShift(null), []);

  const orchestratePending = useCallback(async () => {
    const result = await runOrchestration({
      balances,
      mandate,
      auth: session && isWatcherSessionValid(session, address)
        ? "watcher"
        : "board",
      watcherSession: session,
    });
    if (result) {
      persistConfig({
        ...config,
        lastOrchestratedAt: new Date().toISOString(),
        lastTriggerReason: pendingShift?.shift.reason ?? "Manual orchestration",
      });
      setPendingShift(null);
      onOrchestrationRef.current?.(result);
    }
  }, [
    address,
    balances,
    config,
    mandate,
    pendingShift?.shift.reason,
    persistConfig,
    runOrchestration,
    session,
  ]);

  const runCheckRef = useRef(runCheck);
  runCheckRef.current = runCheck;

  useEffect(() => {
    if (!config.enabled || !isConnected) return;

    const tick = () => {
      void refreshBalances();
      void runCheckRef.current();
    };

    tick();
    const id = window.setInterval(tick, config.pollMs);
    return () => window.clearInterval(id);
  }, [config.enabled, config.pollMs, isConnected, refreshBalances]);

  const status: WatcherStatus = {
    enabled: config.enabled,
    checking,
    orchestrating: running,
    sessionValid: isWatcherSessionValid(session, address),
    lastCheckedAt: config.lastCheckedAt,
    lastTriggerReason: config.lastTriggerReason,
    pendingShift: pendingShift ?? undefined,
    config,
  };

  return {
    status,
    enableWatcher,
    disableWatcher,
    runCheck,
    orchestratePending,
    dismissPending,
    persistWatcherConfig: persistConfig,
  };
}
