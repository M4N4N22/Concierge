import { formatEther } from "viem";
import type { ChartBucket } from "@/lib/dashboard/homeStats";
import { netAfterMarketplaceFee } from "@/lib/marketplaceConstants";

export type EcosystemActivityKind =
  | "sale_in"
  | "rent_in"
  | "purchase"
  | "rent_out";

export type EcosystemActivity = {
  id: string;
  kind: EcosystemActivityKind;
  tokenId: bigint;
  grossWei: bigint;
  netWei: bigint;
  timestamp: number;
  label: string;
};

export type EcosystemListingState = {
  saleActive: boolean;
  salePriceWei?: bigint;
  rentActive: boolean;
  rentPriceWei?: bigint;
  rentDurationSec?: number;
};

export type EcosystemDashboardStats = {
  totalEarnedWei: bigint;
  totalSpentWei: bigint;
  incomeEvents: number;
  spendEvents: number;
  activeListings: number;
  marketSaleCount: number;
  marketRentCount: number;
  listing: EcosystemListingState | null;
  activities: EcosystemActivity[];
  earningsBuckets: ChartBucket[];
};

const KIND_LABEL: Record<EcosystemActivityKind, string> = {
  sale_in: "Sale received",
  rent_in: "Rental income",
  purchase: "Purchase",
  rent_out: "Rental paid",
};

export function activityKindLabel(kind: EcosystemActivityKind): string {
  return KIND_LABEL[kind];
}

export function formatOgAmount(wei: bigint, digits = 4): string {
  const n = Number(formatEther(wei));
  if (!Number.isFinite(n) || n === 0) return "0";
  if (n < 0.0001) return "<0.0001";
  return n.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });
}

export function buildEarningsHistogram(
  activities: EcosystemActivity[],
  weeks = 8
): ChartBucket[] {
  const now = Date.now();
  const buckets: ChartBucket[] = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const end = now - i * 7 * 86_400_000;
    const start = end - 7 * 86_400_000;
    const label =
      i === 0 ? "This wk" : i === 1 ? "Last wk" : `${i}w ago`;

    const earned = activities
      .filter(
        (a) =>
          (a.kind === "sale_in" || a.kind === "rent_in") &&
          a.timestamp >= start &&
          a.timestamp < end
      )
      .reduce((sum, a) => sum + Number(formatEther(a.netWei)), 0);

    buckets.push({
      label,
      value: Math.round(earned * 10_000) / 10_000,
    });
  }

  return buckets;
}

export function summarizeEarnings(activities: EcosystemActivity[]) {
  let totalEarnedWei = 0n;
  let totalSpentWei = 0n;
  let incomeEvents = 0;
  let spendEvents = 0;

  for (const a of activities) {
    if (a.kind === "sale_in" || a.kind === "rent_in") {
      totalEarnedWei += a.netWei;
      incomeEvents++;
    } else {
      totalSpentWei += a.grossWei;
      spendEvents++;
    }
  }

  return {
    totalEarnedWei,
    totalSpentWei,
    incomeEvents,
    spendEvents,
    earningsBuckets: buildEarningsHistogram(activities),
  };
}

export function grossToNet(grossWei: bigint): bigint {
  return netAfterMarketplaceFee(grossWei);
}

export function emptyEcosystemStats(): EcosystemDashboardStats {
  return {
    totalEarnedWei: 0n,
    totalSpentWei: 0n,
    incomeEvents: 0,
    spendEvents: 0,
    activeListings: 0,
    marketSaleCount: 0,
    marketRentCount: 0,
    listing: null,
    activities: [],
    earningsBuckets: buildEarningsHistogram([]),
  };
}
