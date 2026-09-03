/**
 * Operator-funded compute — Concierge pays inference from a shared pool
 * (0G Private Computer Router + 0G Pay balance) so testers skip ledger setup.
 *
 * Direct SDK path remains available for advanced / BYO compute (Insights desk).
 */

export type ComputeBackend = "router" | "direct" | "none";

export type OperatorComputeConfig = {
  backend: ComputeBackend;
  routerConfigured: boolean;
  directConfigured: boolean;
  /** Users can chat/run Insights without their own ledger */
  subsidized: boolean;
  operatorReady: boolean;
  freeTierDailyLimit: number;
  routerModel: string;
  routerBaseUrl: string;
  privateComputerUrl: string;
};

export function isRouterConfigured(): boolean {
  return Boolean(process.env.OG_ROUTER_API_KEY?.trim());
}

export function isDirectConfigured(): boolean {
  return Boolean(
    process.env.OG_MAINNET_PRIVATE_KEY?.trim() ||
      process.env.GALILEO_PRIVATE_KEY?.trim()
  );
}

export function getComputeBackend(): ComputeBackend {
  if (isRouterConfigured()) return "router";
  if (isDirectConfigured()) return "direct";
  return "none";
}

export function getDailyComputeLimit(): number {
  const n = Number(process.env.COMPUTE_FREE_DAILY_LIMIT ?? 10);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 10;
}

export function getOperatorComputeConfig(): OperatorComputeConfig {
  const backend = getComputeBackend();
  const routerConfigured = isRouterConfigured();
  const directConfigured = isDirectConfigured();

  return {
    backend,
    routerConfigured,
    directConfigured,
    subsidized: routerConfigured,
    operatorReady: backend !== "none",
    freeTierDailyLimit: getDailyComputeLimit(),
    routerModel:
      process.env.OG_ROUTER_MODEL?.trim() || "phala/deepseek-chat-v3-0324",
    routerBaseUrl:
      process.env.OG_ROUTER_BASE_URL?.trim() ||
      "https://router-api.0g.ai/v1",
    privateComputerUrl: "https://pc.0g.ai",
  };
}

export function isOperatorComputeReady(): boolean {
  return getOperatorComputeConfig().operatorReady;
}
