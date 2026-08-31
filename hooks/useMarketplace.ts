"use client";

import { useCallback, useState } from "react";
import {
  useAccount,
  useChainId,
  useConfig,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { getPublicClient } from "@wagmi/core";
import { parseEther, formatEther, type Address, type PublicClient } from "viem";
import {
  AGENT_ADDRESSES,
  MARKETPLACE_ADDRESSES,
  ZERO_G_CHAIN_IDS,
} from "@/lib/addresses";
import { isConfiguredContract } from "@/lib/agentAccess";
import { AGENT_MARKETPLACE_ABI } from "@/lib/marketplaceAbi";
import { INFT_AGENT_ABI } from "@/lib/INFTAgentAbi";

export type SaleListingView = {
  tokenId: bigint;
  seller: Address;
  priceWei: bigint;
  priceOg: string;
  domain: string;
  embeddingURI: string;
  aiSignature: string;
};

export type RentListingView = {
  tokenId: bigint;
  owner: Address;
  priceWei: bigint;
  priceOg: string;
  durationSec: number;
  domain: string;
  embeddingURI: string;
  aiSignature: string;
};

function firstConfiguredMarketChain(): number | null {
  for (const id of ZERO_G_CHAIN_IDS) {
    if (isConfiguredContract(MARKETPLACE_ADDRESSES, id)) return id;
  }
  return null;
}

export function useMarketplace() {
  const { address, isConnected, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const config = useConfig();
  const { writeContractAsync } = useWriteContract();
  const activeChainId = useChainId();

  const [loading, setLoading] = useState(false);

  /** Only the wallet's current chain if marketplace is deployed there — never cross-chain fallback. */
  const marketOnActiveChain = isConfiguredContract(
    MARKETPLACE_ADDRESSES,
    activeChainId
  );

  const resolveMarketChain = useCallback((): number => {
    if (isConfiguredContract(MARKETPLACE_ADDRESSES, activeChainId)) {
      return activeChainId!;
    }
    const fallback = firstConfiguredMarketChain();
    if (!fallback) {
      throw new Error(
        "Marketplace not deployed — set NEXT_PUBLIC_MARKETPLACE_ADDRESS / _TESTNET"
      );
    }
    return fallback;
  }, [activeChainId]);

  const ensureMarketplaceChain = useCallback(async (): Promise<number> => {
    if (!isConnected) throw new Error("Wallet not connected");
    const target = resolveMarketChain();
    if (chainId !== target) {
      await switchChainAsync({ chainId: target });
    }
    return target;
  }, [chainId, isConnected, resolveMarketChain, switchChainAsync]);

  const clientFor = useCallback(
    (cid: number): PublicClient => {
      const client = getPublicClient(config, { chainId: cid });
      if (!client) throw new Error(`No RPC client for chain ${cid}`);
      return client as PublicClient;
    },
    [config]
  );

  const marketAt = useCallback((cid: number): Address => {
    const addr = isConfiguredContract(MARKETPLACE_ADDRESSES, cid);
    if (!addr) throw new Error(`No marketplace on chain ${cid}`);
    return addr as Address;
  }, []);

  const agentAt = useCallback((cid: number): Address => {
    const addr = isConfiguredContract(AGENT_ADDRESSES, cid);
    if (!addr) throw new Error(`No Agentic ID contract for chain ${cid}`);
    return addr as Address;
  }, []);

  const isConfigured = !!marketOnActiveChain;

  const fetchAgentCard = useCallback(
    async (cid: number, tokenId: bigint) => {
      const publicClient = clientFor(cid);
      const agent = agentAt(cid);
      const [domain, profile] = await Promise.all([
        publicClient.readContract({
          address: agent,
          abi: INFT_AGENT_ABI,
          functionName: "getAgentDomain",
          args: [tokenId],
        }) as Promise<string>,
        publicClient.readContract({
          address: agent,
          abi: INFT_AGENT_ABI,
          functionName: "getAgentProfile",
          args: [tokenId],
        }),
      ]);
      const p = profile as
        | { embeddingURI: string; aiSignature: string }
        | readonly [string, string];
      return {
        domain,
        embeddingURI: Array.isArray(p)
          ? p[0]
          : (p as { embeddingURI: string }).embeddingURI,
        aiSignature: Array.isArray(p)
          ? p[1]
          : (p as { aiSignature: string }).aiSignature,
      };
    },
    [agentAt, clientFor]
  );

  const fetchSales = useCallback(async (): Promise<SaleListingView[]> => {
    // Never query a fallback chain's address with the wrong-chain client.
    if (!isConfiguredContract(MARKETPLACE_ADDRESSES, activeChainId)) {
      return [];
    }
    const cid = activeChainId!;
    const market = marketAt(cid);
    const publicClient = clientFor(cid);
    const ids = (await publicClient.readContract({
      address: market,
      abi: AGENT_MARKETPLACE_ABI,
      functionName: "getActiveSaleIds",
    })) as bigint[];

    const out: SaleListingView[] = [];
    for (const tokenId of ids) {
      const sale = (await publicClient.readContract({
        address: market,
        abi: AGENT_MARKETPLACE_ABI,
        functionName: "sales",
        args: [tokenId],
      })) as readonly [Address, bigint, boolean];
      if (!sale[2]) continue;
      const card = await fetchAgentCard(cid, tokenId);
      out.push({
        tokenId,
        seller: sale[0],
        priceWei: sale[1],
        priceOg: formatEther(sale[1]),
        ...card,
      });
    }
    return out;
  }, [activeChainId, clientFor, fetchAgentCard, marketAt]);

  const fetchRents = useCallback(async (): Promise<RentListingView[]> => {
    if (!isConfiguredContract(MARKETPLACE_ADDRESSES, activeChainId)) {
      return [];
    }
    const cid = activeChainId!;
    const market = marketAt(cid);
    const publicClient = clientFor(cid);
    const ids = (await publicClient.readContract({
      address: market,
      abi: AGENT_MARKETPLACE_ABI,
      functionName: "getActiveRentIds",
    })) as bigint[];

    const out: RentListingView[] = [];
    for (const tokenId of ids) {
      const rentRow = (await publicClient.readContract({
        address: market,
        abi: AGENT_MARKETPLACE_ABI,
        functionName: "rents",
        args: [tokenId],
      })) as readonly [Address, bigint, bigint, boolean];
      if (!rentRow[3]) continue;
      const card = await fetchAgentCard(cid, tokenId);
      out.push({
        tokenId,
        owner: rentRow[0],
        priceWei: rentRow[1],
        priceOg: formatEther(rentRow[1]),
        durationSec: Number(rentRow[2]),
        ...card,
      });
    }
    return out;
  }, [activeChainId, clientFor, fetchAgentCard, marketAt]);

  const approveMarketplace = useCallback(
    async (tokenId: bigint) => {
      const cid = await ensureMarketplaceChain();
      const market = marketAt(cid);
      const publicClient = clientFor(cid);
      const tx = await writeContractAsync({
        address: agentAt(cid),
        abi: INFT_AGENT_ABI,
        functionName: "approve",
        args: [market, tokenId],
        chainId: cid,
      });
      await publicClient.waitForTransactionReceipt({ hash: tx });
      return tx;
    },
    [agentAt, clientFor, ensureMarketplaceChain, marketAt, writeContractAsync]
  );

  const listForSale = useCallback(
    async (tokenId: bigint, priceOg: string) => {
      const cid = await ensureMarketplaceChain();
      const market = marketAt(cid);
      const publicClient = clientFor(cid);
      setLoading(true);
      try {
        await approveMarketplace(tokenId);
        const tx = await writeContractAsync({
          address: market,
          abi: AGENT_MARKETPLACE_ABI,
          functionName: "listForSale",
          args: [tokenId, parseEther(priceOg)],
          chainId: cid,
        });
        await publicClient.waitForTransactionReceipt({ hash: tx });
        return tx;
      } finally {
        setLoading(false);
      }
    },
    [
      approveMarketplace,
      clientFor,
      ensureMarketplaceChain,
      marketAt,
      writeContractAsync,
    ]
  );

  const cancelSale = useCallback(
    async (tokenId: bigint) => {
      const cid = await ensureMarketplaceChain();
      const market = marketAt(cid);
      const publicClient = clientFor(cid);
      const tx = await writeContractAsync({
        address: market,
        abi: AGENT_MARKETPLACE_ABI,
        functionName: "cancelSale",
        args: [tokenId],
        chainId: cid,
      });
      await publicClient.waitForTransactionReceipt({ hash: tx });
      return tx;
    },
    [clientFor, ensureMarketplaceChain, marketAt, writeContractAsync]
  );

  const buy = useCallback(
    async (tokenId: bigint, priceWei: bigint) => {
      const cid = await ensureMarketplaceChain();
      const market = marketAt(cid);
      const publicClient = clientFor(cid);
      setLoading(true);
      try {
        const tx = await writeContractAsync({
          address: market,
          abi: AGENT_MARKETPLACE_ABI,
          functionName: "buy",
          args: [tokenId],
          value: priceWei,
          chainId: cid,
        });
        await publicClient.waitForTransactionReceipt({ hash: tx });
        return tx;
      } finally {
        setLoading(false);
      }
    },
    [clientFor, ensureMarketplaceChain, marketAt, writeContractAsync]
  );

  const listForRent = useCallback(
    async (tokenId: bigint, priceOg: string, durationSec: number) => {
      const cid = await ensureMarketplaceChain();
      const market = marketAt(cid);
      const publicClient = clientFor(cid);
      setLoading(true);
      try {
        const tx = await writeContractAsync({
          address: market,
          abi: AGENT_MARKETPLACE_ABI,
          functionName: "listForRent",
          args: [tokenId, parseEther(priceOg), BigInt(durationSec)],
          chainId: cid,
        });
        await publicClient.waitForTransactionReceipt({ hash: tx });
        return tx;
      } finally {
        setLoading(false);
      }
    },
    [clientFor, ensureMarketplaceChain, marketAt, writeContractAsync]
  );

  const cancelRent = useCallback(
    async (tokenId: bigint) => {
      const cid = await ensureMarketplaceChain();
      const market = marketAt(cid);
      const publicClient = clientFor(cid);
      const tx = await writeContractAsync({
        address: market,
        abi: AGENT_MARKETPLACE_ABI,
        functionName: "cancelRent",
        args: [tokenId],
        chainId: cid,
      });
      await publicClient.waitForTransactionReceipt({ hash: tx });
      return tx;
    },
    [clientFor, ensureMarketplaceChain, marketAt, writeContractAsync]
  );

  const rent = useCallback(
    async (tokenId: bigint, priceWei: bigint) => {
      const cid = await ensureMarketplaceChain();
      const market = marketAt(cid);
      const publicClient = clientFor(cid);
      setLoading(true);
      try {
        const tx = await writeContractAsync({
          address: market,
          abi: AGENT_MARKETPLACE_ABI,
          functionName: "rent",
          args: [tokenId],
          value: priceWei,
          chainId: cid,
        });
        await publicClient.waitForTransactionReceipt({ hash: tx });
        return tx;
      } finally {
        setLoading(false);
      }
    },
    [clientFor, ensureMarketplaceChain, marketAt, writeContractAsync]
  );

  const transferAgent = useCallback(
    async (tokenId: bigint, to: Address) => {
      if (!isConnected) throw new Error("Wallet not connected");
      const cid =
        isConfiguredContract(AGENT_ADDRESSES, chainId) != null
          ? chainId!
          : firstConfiguredMarketChain() ??
            ZERO_G_CHAIN_IDS.find((id) =>
              isConfiguredContract(AGENT_ADDRESSES, id)
            );
      if (!cid) throw new Error("No Agentic ID contract configured");
      if (chainId !== cid) {
        await switchChainAsync({ chainId: cid });
      }
      if (!address) throw new Error("Wallet not connected");
      setLoading(true);
      try {
        const publicClient = clientFor(cid);
        const tx = await writeContractAsync({
          address: agentAt(cid),
          abi: INFT_AGENT_ABI,
          functionName: "transferFrom",
          args: [address, to, tokenId],
          chainId: cid,
        });
        await publicClient.waitForTransactionReceipt({ hash: tx });
        return tx;
      } finally {
        setLoading(false);
      }
    },
    [
      address,
      agentAt,
      chainId,
      clientFor,
      isConnected,
      switchChainAsync,
      writeContractAsync,
    ]
  );

  return {
    isConfigured,
    loading,
    address,
    isConnected,
    fetchSales,
    fetchRents,
    listForSale,
    cancelSale,
    buy,
    listForRent,
    cancelRent,
    rent,
    transferAgent,
    approveMarketplace,
  };
}
