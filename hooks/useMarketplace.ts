"use client";

import { useCallback, useRef, useState } from "react";
import {
  useAccount,
  useChainId,
  useConfig,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { getPublicClient } from "@wagmi/core";
import { parseEther, formatEther, type Address, type Hash, type PublicClient } from "viem";
import {
  AGENT_ADDRESSES,
  MARKETPLACE_ADDRESSES,
  ZERO_G_CHAIN_IDS,
} from "@/lib/addresses";
import { isConfiguredContract } from "@/lib/agentAccess";
import { AGENT_MARKETPLACE_ABI } from "@/lib/marketplaceAbi";
import { INFT_AGENT_ABI } from "@/lib/INFTAgentAbi";
import {
  getPendingNonce,
  isMarketplaceApproved,
  isNonceTooLowError,
  waitForNonceAdvance,
  waitForReceipt,
} from "@/lib/wallet/marketplaceTx";

import { fetchVaultFilesForUser } from "@/lib/vault/fetchVaultFilesForUser";
import type { VaultFile } from "@/hooks/useUserFiles";

type VaultFileSummary = Pick<VaultFile, "category" | "insightsCID">;

export type SaleListingView = {
  tokenId: bigint;
  seller: Address;
  priceWei: bigint;
  priceOg: string;
  domain: string;
  embeddingURI: string;
  aiSignature: string;
  vaultFileCount: number;
  vaultFiles: VaultFileSummary[];
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
  vaultFileCount: number;
  vaultFiles: VaultFileSummary[];
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
  const txLockRef = useRef(false);

  const writeOnce = useCallback(
    async (
      cid: number,
      publicClient: PublicClient,
      request: Parameters<typeof writeContractAsync>[0],
      opts?: { nonce?: number }
    ): Promise<Hash> => {
      if (!address) throw new Error("Wallet not connected");
      const nonce =
        opts?.nonce ?? (await getPendingNonce(publicClient, address));

      try {
        const hash = await writeContractAsync({
          ...request,
          chainId: cid,
          nonce,
        });
        await waitForReceipt(publicClient, hash);
        return hash;
      } catch (err: unknown) {
        if (!isNonceTooLowError(err)) throw err;
        const refreshed = await getPendingNonce(publicClient, address);
        const hash = await writeContractAsync({
          ...request,
          chainId: cid,
          nonce: refreshed,
        });
        await waitForReceipt(publicClient, hash);
        return hash;
      }
    },
    [address, writeContractAsync]
  );

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
      let vaultFileCount = 0;
      let vaultFiles: VaultFileSummary[] = [];
      try {
        const fetched = await fetchVaultFilesForUser({
          chainId: cid,
          userAddress: sale[0],
          publicClient,
        });
        vaultFileCount = fetched.length;
        vaultFiles = fetched.map((f) => ({
          category: f.category,
          insightsCID: f.insightsCID,
        }));
      } catch {
        vaultFileCount = 0;
      }
      out.push({
        tokenId,
        seller: sale[0],
        priceWei: sale[1],
        priceOg: formatEther(sale[1]),
        vaultFileCount,
        vaultFiles,
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
      let vaultFileCount = 0;
      let vaultFiles: VaultFileSummary[] = [];
      try {
        const fetched = await fetchVaultFilesForUser({
          chainId: cid,
          userAddress: rentRow[0],
          publicClient,
        });
        vaultFileCount = fetched.length;
        vaultFiles = fetched.map((f) => ({
          category: f.category,
          insightsCID: f.insightsCID,
        }));
      } catch {
        vaultFileCount = 0;
      }
      out.push({
        tokenId,
        owner: rentRow[0],
        priceWei: rentRow[1],
        priceOg: formatEther(rentRow[1]),
        durationSec: Number(rentRow[2]),
        vaultFileCount,
        vaultFiles,
        ...card,
      });
    }
    return out;
  }, [activeChainId, clientFor, fetchAgentCard, marketAt]);

  const approveMarketplace = useCallback(
    async (tokenId: bigint) => {
      if (!address) throw new Error("Wallet not connected");
      const cid = await ensureMarketplaceChain();
      const market = marketAt(cid);
      const agent = agentAt(cid);
      const publicClient = clientFor(cid);

      const already = await isMarketplaceApproved({
        publicClient,
        agent,
        market,
        tokenId,
        owner: address,
      });
      if (already) return null;

      const nonceBefore = await getPendingNonce(publicClient, address);
      const hash = await writeOnce(cid, publicClient, {
        address: agent,
        abi: INFT_AGENT_ABI,
        functionName: "approve",
        args: [market, tokenId],
      });
      await waitForNonceAdvance(publicClient, address, nonceBefore);
      return hash;
    },
    [
      address,
      agentAt,
      clientFor,
      ensureMarketplaceChain,
      marketAt,
      writeOnce,
    ]
  );

  const listForSale = useCallback(
    async (tokenId: bigint, priceOg: string) => {
      if (txLockRef.current) {
        throw new Error("Another marketplace transaction is in progress");
      }
      if (!address) throw new Error("Wallet not connected");

      const cid = await ensureMarketplaceChain();
      const market = marketAt(cid);
      const publicClient = clientFor(cid);

      txLockRef.current = true;
      setLoading(true);
      try {
        await approveMarketplace(tokenId);

        const nonce = await getPendingNonce(publicClient, address);
        return await writeOnce(cid, publicClient, {
          address: market,
          abi: AGENT_MARKETPLACE_ABI,
          functionName: "listForSale",
          args: [tokenId, parseEther(priceOg)],
        }, { nonce });
      } finally {
        txLockRef.current = false;
        setLoading(false);
      }
    },
    [
      address,
      approveMarketplace,
      clientFor,
      ensureMarketplaceChain,
      marketAt,
      writeOnce,
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
      if (!address) throw new Error("Wallet not connected");

      const existingAgent = (await publicClient.readContract({
        address: agentAt(cid),
        abi: INFT_AGENT_ABI,
        functionName: "agentByOwner",
        args: [address],
      })) as bigint;
      if (existingAgent !== 0n) {
        throw new Error(
          "You already hold an Agentic ID on this chain — only one per wallet."
        );
      }

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
    [
      address,
      agentAt,
      clientFor,
      ensureMarketplaceChain,
      marketAt,
      writeContractAsync,
    ]
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
