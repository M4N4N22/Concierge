"use client";

import { useCallback, useState } from "react";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { parseEther, formatEther, type Address } from "viem";
import { AGENT_ADDRESSES, MARKETPLACE_ADDRESSES, ZERO_G_CHAIN_IDS } from "@/lib/addresses";
import { AGENT_MARKETPLACE_ABI } from "@/lib/marketplaceAbi";
import { INFT_AGENT_ABI } from "@/lib/INFTAgentAbi";
import { zeroGTestnet } from "@/lib/wagmi/config";

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

export function useMarketplace() {
  const { address, isConnected, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const activeChainId = useChainId();

  const [loading, setLoading] = useState(false);

  const ensureChain = useCallback(async () => {
    if (!isConnected) throw new Error("Wallet not connected");
    const supported = ZERO_G_CHAIN_IDS as readonly number[];
    if (!chainId || !supported.includes(chainId)) {
      await switchChainAsync({ chainId: zeroGTestnet.id });
    }
  }, [chainId, isConnected, switchChainAsync]);

  const getMarketplace = useCallback(() => {
    const id =
      activeChainId && MARKETPLACE_ADDRESSES[activeChainId]
        ? activeChainId
        : zeroGTestnet.id;
    const addr = MARKETPLACE_ADDRESSES[id] as Address | undefined;
    if (!addr) return null;
    return addr;
  }, [activeChainId]);

  const getAgent = useCallback(() => {
    const id =
      activeChainId && AGENT_ADDRESSES[activeChainId]
        ? activeChainId
        : zeroGTestnet.id;
    const addr = AGENT_ADDRESSES[id] as Address | undefined;
    if (!addr) throw new Error(`No Agentic ID contract for chain ${id}`);
    return addr;
  }, [activeChainId]);

  const isConfigured = !!getMarketplace();

  const fetchAgentCard = useCallback(
    async (tokenId: bigint) => {
      if (!publicClient) throw new Error("No public client");
      const agent = getAgent();
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
        embeddingURI: Array.isArray(p) ? p[0] : p.embeddingURI,
        aiSignature: Array.isArray(p) ? p[1] : p.aiSignature,
      };
    },
    [getAgent, publicClient]
  );

  const fetchSales = useCallback(async (): Promise<SaleListingView[]> => {
    const market = getMarketplace();
    if (!market || !publicClient) return [];
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
      const card = await fetchAgentCard(tokenId);
      out.push({
        tokenId,
        seller: sale[0],
        priceWei: sale[1],
        priceOg: formatEther(sale[1]),
        ...card,
      });
    }
    return out;
  }, [fetchAgentCard, getMarketplace, publicClient]);

  const fetchRents = useCallback(async (): Promise<RentListingView[]> => {
    const market = getMarketplace();
    if (!market || !publicClient) return [];
    const ids = (await publicClient.readContract({
      address: market,
      abi: AGENT_MARKETPLACE_ABI,
      functionName: "getActiveRentIds",
    })) as bigint[];

    const out: RentListingView[] = [];
    for (const tokenId of ids) {
      const rent = (await publicClient.readContract({
        address: market,
        abi: AGENT_MARKETPLACE_ABI,
        functionName: "rents",
        args: [tokenId],
      })) as readonly [Address, bigint, bigint, boolean];
      if (!rent[3]) continue;
      const card = await fetchAgentCard(tokenId);
      out.push({
        tokenId,
        owner: rent[0],
        priceWei: rent[1],
        priceOg: formatEther(rent[1]),
        durationSec: Number(rent[2]),
        ...card,
      });
    }
    return out;
  }, [fetchAgentCard, getMarketplace, publicClient]);

  const approveMarketplace = useCallback(
    async (tokenId: bigint) => {
      await ensureChain();
      const market = getMarketplace();
      if (!market) throw new Error("Marketplace not deployed — set NEXT_PUBLIC_MARKETPLACE_*");
      const tx = await writeContractAsync({
        address: getAgent(),
        abi: INFT_AGENT_ABI,
        functionName: "approve",
        args: [market, tokenId],
      });
      await publicClient!.waitForTransactionReceipt({ hash: tx });
      return tx;
    },
    [ensureChain, getAgent, getMarketplace, publicClient, writeContractAsync]
  );

  const listForSale = useCallback(
    async (tokenId: bigint, priceOg: string) => {
      await ensureChain();
      const market = getMarketplace();
      if (!market) throw new Error("Marketplace not deployed");
      setLoading(true);
      try {
        await approveMarketplace(tokenId);
        const tx = await writeContractAsync({
          address: market,
          abi: AGENT_MARKETPLACE_ABI,
          functionName: "listForSale",
          args: [tokenId, parseEther(priceOg)],
        });
        await publicClient!.waitForTransactionReceipt({ hash: tx });
        return tx;
      } finally {
        setLoading(false);
      }
    },
    [approveMarketplace, ensureChain, getMarketplace, publicClient, writeContractAsync]
  );

  const cancelSale = useCallback(
    async (tokenId: bigint) => {
      await ensureChain();
      const market = getMarketplace();
      if (!market) throw new Error("Marketplace not deployed");
      const tx = await writeContractAsync({
        address: market,
        abi: AGENT_MARKETPLACE_ABI,
        functionName: "cancelSale",
        args: [tokenId],
      });
      await publicClient!.waitForTransactionReceipt({ hash: tx });
      return tx;
    },
    [ensureChain, getMarketplace, publicClient, writeContractAsync]
  );

  const buy = useCallback(
    async (tokenId: bigint, priceWei: bigint) => {
      await ensureChain();
      const market = getMarketplace();
      if (!market) throw new Error("Marketplace not deployed");
      setLoading(true);
      try {
        const tx = await writeContractAsync({
          address: market,
          abi: AGENT_MARKETPLACE_ABI,
          functionName: "buy",
          args: [tokenId],
          value: priceWei,
        });
        await publicClient!.waitForTransactionReceipt({ hash: tx });
        return tx;
      } finally {
        setLoading(false);
      }
    },
    [ensureChain, getMarketplace, publicClient, writeContractAsync]
  );

  const listForRent = useCallback(
    async (tokenId: bigint, priceOg: string, durationSec: number) => {
      await ensureChain();
      const market = getMarketplace();
      if (!market) throw new Error("Marketplace not deployed");
      setLoading(true);
      try {
        const tx = await writeContractAsync({
          address: market,
          abi: AGENT_MARKETPLACE_ABI,
          functionName: "listForRent",
          args: [tokenId, parseEther(priceOg), BigInt(durationSec)],
        });
        await publicClient!.waitForTransactionReceipt({ hash: tx });
        return tx;
      } finally {
        setLoading(false);
      }
    },
    [ensureChain, getMarketplace, publicClient, writeContractAsync]
  );

  const cancelRent = useCallback(
    async (tokenId: bigint) => {
      await ensureChain();
      const market = getMarketplace();
      if (!market) throw new Error("Marketplace not deployed");
      const tx = await writeContractAsync({
        address: market,
        abi: AGENT_MARKETPLACE_ABI,
        functionName: "cancelRent",
        args: [tokenId],
      });
      await publicClient!.waitForTransactionReceipt({ hash: tx });
      return tx;
    },
    [ensureChain, getMarketplace, publicClient, writeContractAsync]
  );

  const rent = useCallback(
    async (tokenId: bigint, priceWei: bigint) => {
      await ensureChain();
      const market = getMarketplace();
      if (!market) throw new Error("Marketplace not deployed");
      setLoading(true);
      try {
        const tx = await writeContractAsync({
          address: market,
          abi: AGENT_MARKETPLACE_ABI,
          functionName: "rent",
          args: [tokenId],
          value: priceWei,
        });
        await publicClient!.waitForTransactionReceipt({ hash: tx });
        return tx;
      } finally {
        setLoading(false);
      }
    },
    [ensureChain, getMarketplace, publicClient, writeContractAsync]
  );

  const transferAgent = useCallback(
    async (tokenId: bigint, to: Address) => {
      await ensureChain();
      if (!address) throw new Error("Wallet not connected");
      setLoading(true);
      try {
        const tx = await writeContractAsync({
          address: getAgent(),
          abi: INFT_AGENT_ABI,
          functionName: "transferFrom",
          args: [address, to, tokenId],
        });
        await publicClient!.waitForTransactionReceipt({ hash: tx });
        return tx;
      } finally {
        setLoading(false);
      }
    },
    [address, ensureChain, getAgent, publicClient, writeContractAsync]
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
