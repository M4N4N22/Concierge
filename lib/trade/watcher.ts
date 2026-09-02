import type { BalanceSnapshot } from "./suggest";
import { heuristicTradeSuggest } from "./suggest";
import type { TradeMandate, TradeSuggestion } from "./types";

export const WATCHER_STORAGE_KEY = "concierge.portfolioWatcher.v1";
export const WATCHER_SESSION_KEY = "concierge.watcherSession.v1";

export const DEFAULT_WATCHER_CONFIG: PortfolioWatcherConfig = {
  enabled: false,
  pollMs: 120_000,
  orchestrateCooldownMs: 900_000,
  usdcDeltaMin: 1,
  ogPctDeltaMin: 0.05,
  autoOrchestrate: true,
};

export type PortfolioWatcherConfig = {
  enabled: boolean;
  /** Balance poll interval */
  pollMs: number;
  /** Min time between 0G Compute orchestrations */
  orchestrateCooldownMs: number;
  /** Absolute USDC change to treat as material */
  usdcDeltaMin: number;
  /** Relative OG change (0.05 = 5%) */
  ogPctDeltaMin: number;
  /** Re-run agents automatically when shift detected (uses watcher signature) */
  autoOrchestrate: boolean;
  lastCheckedAt?: string;
  lastOrchestratedAt?: string;
  lastTriggerReason?: string;
};

export type PortfolioSnapshot = BalanceSnapshot & {
  checkedAt: string;
};

export type PortfolioShift = {
  material: boolean;
  reason?: string;
  usdcDelta: number;
  ogPctDelta: number;
};

export type WatcherHeuristicPreview = {
  shift: PortfolioShift;
  suggestion: TradeSuggestion;
};

export function loadWatcherConfig(): PortfolioWatcherConfig {
  if (typeof window === "undefined") return { ...DEFAULT_WATCHER_CONFIG };
  try {
    const raw = localStorage.getItem(WATCHER_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_WATCHER_CONFIG };
    return { ...DEFAULT_WATCHER_CONFIG, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_WATCHER_CONFIG };
  }
}

export function saveWatcherConfig(config: PortfolioWatcherConfig) {
  localStorage.setItem(WATCHER_STORAGE_KEY, JSON.stringify(config));
}

export function snapshotFromBalances(
  balances: BalanceSnapshot
): PortfolioSnapshot {
  return { ...balances, checkedAt: new Date().toISOString() };
}

export function detectPortfolioShift(
  prev: PortfolioSnapshot | null,
  next: PortfolioSnapshot,
  thresholds: Pick<PortfolioWatcherConfig, "usdcDeltaMin" | "ogPctDeltaMin">
): PortfolioShift {
  if (!prev) {
    return { material: false, usdcDelta: 0, ogPctDelta: 0 };
  }

  const usdcDelta = Math.abs(next.usdc - prev.usdc);
  const ogBase = Math.max(prev.og, next.og, 1e-9);
  const ogPctDelta = Math.abs(next.og - prev.og) / ogBase;

  if (usdcDelta >= thresholds.usdcDeltaMin) {
    return {
      material: true,
      reason: `USDC moved ${usdcDelta.toFixed(2)}`,
      usdcDelta,
      ogPctDelta,
    };
  }

  if (ogPctDelta >= thresholds.ogPctDeltaMin) {
    return {
      material: true,
      reason: `OG shifted ${(ogPctDelta * 100).toFixed(1)}%`,
      usdcDelta,
      ogPctDelta,
    };
  }

  return { material: false, usdcDelta, ogPctDelta };
}

export function canOrchestrateNow(
  config: PortfolioWatcherConfig,
  now = Date.now()
): boolean {
  if (!config.lastOrchestratedAt) return true;
  const last = Date.parse(config.lastOrchestratedAt);
  if (!Number.isFinite(last)) return true;
  return now - last >= config.orchestrateCooldownMs;
}

/** Local desk preview — no compute spend. */
export function previewHeuristicOnShift(
  balances: BalanceSnapshot,
  mandate: Pick<TradeMandate, "maxNotional">,
  shift: PortfolioShift
): WatcherHeuristicPreview {
  const suggestion = heuristicTradeSuggest(balances, mandate);
  return { shift, suggestion };
}
