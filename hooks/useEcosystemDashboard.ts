"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import type { Address } from "viem";
import { MARKETPLACE_ADDRESSES } from "@/lib/addresses";
import { isConfiguredContract } from "@/lib/agentAccess";
import { AGENT_MARKETPLACE_ABI } from "@/lib/marketplaceAbi";
import type { MyAgenticId } from "@/hooks/useAgenticId";
import {
  emptyEcosystemStats,
  grossToNet,
  summarizeEarnings,
  type EcosystemActivity,
  type EcosystemDashboardStats,
  type EcosystemListingState,
} from "@/lib/dashboard/ecosystemStats";

const LOG_LOOKBACK_BLOCKS = 500_000n;

async function blockTimestamp(
  publicClient: NonNullable<ReturnType<typeof usePublicClient>>,
  blockNumber: bigint,
  cache: Map<bigint, number>
): Promise<number> {
  const cached = cache.get(blockNumber);
  if (cached != null) return cached;
  const block = await publicClient.getBlock({ blockNumber });
  const ts = Number(block.timestamp) * 1000;
  cache.set(blockNumber, ts);
  return ts;
}

export function useEcosystemDashboard(agent: MyAgenticId | null) {
  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient();
  const [stats, setStats] = useState<EcosystemDashboardStats>(emptyEcosystemStats);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isConnected || !address || !publicClient || !chainId) {
      setStats(emptyEcosystemStats());
      return;
    }

    const market = isConfiguredContract(MARKETPLACE_ADDRESSES, chainId);
    if (!market) {
      setStats(emptyEcosystemStats());
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const marketAddr = market as Address;
      const head = await publicClient.getBlockNumber();
      const fromBlock = head > LOG_LOOKBACK_BLOCKS ? head - LOG_LOOKBACK_BLOCKS : 0n;
      const tsCache = new Map<bigint, number>();

      const [saleIds, rentIds, salesIn, salesOut, rentsIn, rentsOut] =
        await Promise.all([
          publicClient.readContract({
            address: marketAddr,
            abi: AGENT_MARKETPLACE_ABI,
            functionName: "getActiveSaleIds",
          }) as Promise<bigint[]>,
          publicClient.readContract({
            address: marketAddr,
            abi: AGENT_MARKETPLACE_ABI,
            functionName: "getActiveRentIds",
          }) as Promise<bigint[]>,
          publicClient.getContractEvents({
            address: marketAddr,
            abi: AGENT_MARKETPLACE_ABI,
            eventName: "Sold",
            args: { seller: address },
            fromBlock,
          }),
          publicClient.getContractEvents({
            address: marketAddr,
            abi: AGENT_MARKETPLACE_ABI,
            eventName: "Sold",
            args: { buyer: address },
            fromBlock,
          }),
          publicClient.getContractEvents({
            address: marketAddr,
            abi: AGENT_MARKETPLACE_ABI,
            eventName: "Rented",
            args: { owner: address },
            fromBlock,
          }),
          publicClient.getContractEvents({
            address: marketAddr,
            abi: AGENT_MARKETPLACE_ABI,
            eventName: "Rented",
            args: { renter: address },
            fromBlock,
          }),
        ]);

      const activities: EcosystemActivity[] = [];

      for (const log of salesIn) {
        const gross = log.args.priceWei ?? 0n;
        const ts = await blockTimestamp(publicClient, log.blockNumber, tsCache);
        activities.push({
          id: `${log.transactionHash}-sale-in-${log.logIndex}`,
          kind: "sale_in",
          tokenId: log.args.tokenId ?? 0n,
          grossWei: gross,
          netWei: grossToNet(gross),
          timestamp: ts,
          label: `Sale · #${log.args.tokenId?.toString() ?? "?"}`,
        });
      }

      for (const log of rentsIn) {
        const gross = log.args.priceWei ?? 0n;
        const ts = await blockTimestamp(publicClient, log.blockNumber, tsCache);
        activities.push({
          id: `${log.transactionHash}-rent-in-${log.logIndex}`,
          kind: "rent_in",
          tokenId: log.args.tokenId ?? 0n,
          grossWei: gross,
          netWei: grossToNet(gross),
          timestamp: ts,
          label: `Rental · #${log.args.tokenId?.toString() ?? "?"}`,
        });
      }

      for (const log of salesOut) {
        const gross = log.args.priceWei ?? 0n;
        const ts = await blockTimestamp(publicClient, log.blockNumber, tsCache);
        activities.push({
          id: `${log.transactionHash}-purchase-${log.logIndex}`,
          kind: "purchase",
          tokenId: log.args.tokenId ?? 0n,
          grossWei: gross,
          netWei: gross,
          timestamp: ts,
          label: `Bought · #${log.args.tokenId?.toString() ?? "?"}`,
        });
      }

      for (const log of rentsOut) {
        const gross = log.args.priceWei ?? 0n;
        const ts = await blockTimestamp(publicClient, log.blockNumber, tsCache);
        activities.push({
          id: `${log.transactionHash}-rent-out-${log.logIndex}`,
          kind: "rent_out",
          tokenId: log.args.tokenId ?? 0n,
          grossWei: gross,
          netWei: gross,
          timestamp: ts,
          label: `Rented · #${log.args.tokenId?.toString() ?? "?"}`,
        });
      }

      activities.sort((a, b) => b.timestamp - a.timestamp);

      let listing: EcosystemListingState | null = null;
      let activeListings = 0;

      if (agent?.access === "owner") {
        const [saleRow, rentRow] = await Promise.all([
          publicClient.readContract({
            address: marketAddr,
            abi: AGENT_MARKETPLACE_ABI,
            functionName: "sales",
            args: [agent.tokenId],
          }) as Promise<readonly [Address, bigint, boolean]>,
          publicClient.readContract({
            address: marketAddr,
            abi: AGENT_MARKETPLACE_ABI,
            functionName: "rents",
            args: [agent.tokenId],
          }) as Promise<readonly [Address, bigint, bigint, boolean]>,
        ]);

        listing = {
          saleActive: saleRow[2],
          salePriceWei: saleRow[2] ? saleRow[1] : undefined,
          rentActive: rentRow[3],
          rentPriceWei: rentRow[3] ? rentRow[1] : undefined,
          rentDurationSec: rentRow[3] ? Number(rentRow[2]) : undefined,
        };
        if (listing.saleActive) activeListings++;
        if (listing.rentActive) activeListings++;
      }

      const summary = summarizeEarnings(activities);

      setStats({
        ...summary,
        activeListings,
        marketSaleCount: saleIds.length,
        marketRentCount: rentIds.length,
        listing,
        activities,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load ecosystem stats";
      setError(message);
      setStats(emptyEcosystemStats());
    } finally {
      setLoading(false);
    }
  }, [address, agent, chainId, isConnected, publicClient]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { stats, loading, error, refresh };
}
