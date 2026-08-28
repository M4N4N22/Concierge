"use client";

import { useCallback, useState } from "react";
import { useAccount, useChainId, usePublicClient } from "wagmi";
import { formatEther, parseAbiItem, type Address, type Hash } from "viem";
import {
  normalizeWalletEvidence,
  type WalletTransfer,
} from "@/lib/evidence";

const TRANSFER_EVENT = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)"
);

const LOOKBACK_BLOCKS = 2_000n;
const MAX_LOGS = 40;

function padTopicAddress(address: Address): Hash {
  return `0x${address.slice(2).toLowerCase().padStart(64, "0")}` as Hash;
}

export function useWalletEvidence() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWalletEvidence = useCallback(async () => {
    if (!isConnected || !address || !publicClient) {
      throw new Error("Connect your wallet first");
    }

    setLoading(true);
    setError(null);

    try {
      const [balance, latest] = await Promise.all([
        publicClient.getBalance({ address }),
        publicClient.getBlockNumber(),
      ]);

      const fromBlock = latest > LOOKBACK_BLOCKS ? latest - LOOKBACK_BLOCKS : 0n;
      const topicAddress = padTopicAddress(address);

      const [outLogs, inLogs] = await Promise.all([
        publicClient.getLogs({
          event: TRANSFER_EVENT,
          args: { from: address },
          fromBlock,
          toBlock: latest,
        }),
        publicClient.getLogs({
          event: TRANSFER_EVENT,
          args: { to: address },
          fromBlock,
          toBlock: latest,
        }),
      ]);

      // Fallback if indexed args filter is unsupported — scan both topic positions
      let outbound = outLogs;
      let inbound = inLogs;
      if (outLogs.length === 0 && inLogs.length === 0) {
        const raw = await publicClient.getLogs({
          event: TRANSFER_EVENT,
          fromBlock,
          toBlock: latest,
        });
        outbound = raw.filter(
          (l) => l.topics[1]?.toLowerCase() === topicAddress.toLowerCase()
        );
        inbound = raw.filter(
          (l) => l.topics[2]?.toLowerCase() === topicAddress.toLowerCase()
        );
      }

      const transfers: WalletTransfer[] = [];

      for (const log of outbound.slice(-MAX_LOGS)) {
        const value = log.args.value ?? 0n;
        transfers.push({
          txHash: log.transactionHash ?? "0x",
          blockNumber: Number(log.blockNumber ?? 0n),
          from: address,
          to: (log.args.to as string) ?? "",
          value: formatEther(value),
          tokenAddress: log.address,
          direction: "out",
        });
      }
      for (const log of inbound.slice(-MAX_LOGS)) {
        const value = log.args.value ?? 0n;
        transfers.push({
          txHash: log.transactionHash ?? "0x",
          blockNumber: Number(log.blockNumber ?? 0n),
          from: (log.args.from as string) ?? "",
          to: address,
          value: formatEther(value),
          tokenAddress: log.address,
          direction: "in",
        });
      }

      transfers.sort((a, b) => b.blockNumber - a.blockNumber);

      const pack = normalizeWalletEvidence({
        address,
        chainId,
        nativeBalanceOg: Number(formatEther(balance)).toFixed(4),
        transfers: transfers.slice(0, MAX_LOGS),
      });

      return pack;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to sync wallet evidence";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [address, chainId, isConnected, publicClient]);

  return { fetchWalletEvidence, loading, error, isConnected, address, chainId };
}
