"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import type { Address } from "viem";
import {
  AGENT_ADDRESSES,
  MARKETPLACE_ADDRESSES,
  ZERO_G_CHAIN_IDS,
} from "@/lib/addresses";
import { INFT_AGENT_ABI } from "@/lib/INFTAgentAbi";
import { AGENT_MARKETPLACE_ABI } from "@/lib/marketplaceAbi";
import { isConfiguredContract } from "@/lib/agentAccess";
import { useINFTAgent } from "@/hooks/useINFTAgent";

export type MyAgenticId = {
  tokenId: bigint;
  domain: string;
  vault: `0x${string}`;
  embeddingURI: string;
  aiSignature: string;
  /** Owner holds the NFT; rental is a timed marketplace lease. */
  access: "owner" | "rental";
  rentalExpiresAt?: number;
};

function configuredAgentChain(chainId: number | undefined): number | null {
  if (
    chainId &&
    (ZERO_G_CHAIN_IDS as readonly number[]).includes(chainId) &&
    isConfiguredContract(AGENT_ADDRESSES, chainId)
  ) {
    return chainId;
  }
  return null;
}

export function useAgenticId() {
  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient();
  const { updateProfile, updateMetadata } = useINFTAgent();
  const [agent, setAgent] = useState<MyAgenticId | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAgentAddress = useCallback(() => {
    const activeChain = configuredAgentChain(chainId);
    if (!activeChain) {
      throw new Error(
        chainId
          ? `No Agentic ID contract for chain ${chainId}`
          : "Connect to a 0G chain with Agentic ID configured"
      );
    }
    return AGENT_ADDRESSES[activeChain] as `0x${string}`;
  }, [chainId]);

  const loadAgentCard = useCallback(
    async (contract: `0x${string}`, tokenId: bigint) => {
      if (!publicClient) throw new Error("No public client");
      const [domain, vault, profileRaw] = await Promise.all([
        publicClient.readContract({
          address: contract,
          abi: INFT_AGENT_ABI,
          functionName: "getAgentDomain",
          args: [tokenId],
        }) as Promise<string>,
        publicClient.readContract({
          address: contract,
          abi: INFT_AGENT_ABI,
          functionName: "getVault",
          args: [tokenId],
        }) as Promise<`0x${string}`>,
        publicClient.readContract({
          address: contract,
          abi: INFT_AGENT_ABI,
          functionName: "getAgentProfile",
          args: [tokenId],
        }),
      ]);

      const profile = profileRaw as
        | { embeddingURI: string; aiSignature: string }
        | readonly [string, string];

      return {
        domain,
        vault,
        embeddingURI: Array.isArray(profile)
          ? profile[0]
          : (profile as { embeddingURI: string }).embeddingURI,
        aiSignature: Array.isArray(profile)
          ? profile[1]
          : (profile as { aiSignature: string }).aiSignature,
      };
    },
    [publicClient]
  );

  const findRentedAgent = useCallback(
    async (
      contract: `0x${string}`,
      wallet: Address
    ): Promise<MyAgenticId | null> => {
      if (!publicClient || !chainId) return null;
      const market = isConfiguredContract(MARKETPLACE_ADDRESSES, chainId);
      if (!market) return null;

      const ids = (await publicClient.readContract({
        address: market as Address,
        abi: AGENT_MARKETPLACE_ABI,
        functionName: "getActiveRentIds",
      })) as bigint[];

      const now = Math.floor(Date.now() / 1000);
      for (const tokenId of ids) {
        const rental = (await publicClient.readContract({
          address: market as Address,
          abi: AGENT_MARKETPLACE_ABI,
          functionName: "rentals",
          args: [tokenId],
        })) as readonly [Address, bigint];

        const renter = rental[0];
        const expiresAt = Number(rental[1]);
        if (
          renter.toLowerCase() === wallet.toLowerCase() &&
          expiresAt >= now
        ) {
          const card = await loadAgentCard(contract, tokenId);
          return {
            tokenId,
            ...card,
            access: "rental",
            rentalExpiresAt: expiresAt,
          };
        }
      }
      return null;
    },
    [chainId, loadAgentCard, publicClient]
  );

  const refetch = useCallback(async () => {
    if (!isConnected || !address || !publicClient) {
      setAgent(null);
      return null;
    }

    const activeChain = configuredAgentChain(chainId);
    if (!activeChain) {
      setAgent(null);
      return null;
    }

    setLoading(true);
    setError(null);
    try {
      const contract = getAgentAddress();
      const tokenId = (await publicClient.readContract({
        address: contract,
        abi: INFT_AGENT_ABI,
        functionName: "agentByOwner",
        args: [address],
      })) as bigint;

      if (tokenId && tokenId !== 0n) {
        const card = await loadAgentCard(contract, tokenId);
        const next: MyAgenticId = {
          tokenId,
          ...card,
          access: "owner",
        };
        setAgent(next);
        return next;
      }

      const rented = await findRentedAgent(contract, address);
      setAgent(rented);
      return rented;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load Agentic ID";
      setError(message);
      setAgent(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [
    address,
    chainId,
    findRentedAgent,
    getAgentAddress,
    isConnected,
    loadAgentCard,
    publicClient,
  ]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  /** Point Agentic ID profile at the latest board transcript + guard seal (owners only). */
  const bindBoardSession = useCallback(
    async (args: {
      tokenId: bigint;
      transcriptRootHash: string;
      sealHash: `0x${string}`;
    }) => {
      if (agent?.access === "rental") {
        throw new Error("Renters cannot bind board seals — ownership required");
      }
      const embeddingURI = `0g://board/${args.transcriptRootHash}`;
      const aiSignature = `guard:${args.sealHash}`;
      const tx = await updateProfile(args.tokenId, embeddingURI, aiSignature);
      try {
        await updateMetadata(args.tokenId, args.sealHash);
      } catch {
        // profile bind is enough if metadata update fails
      }
      await refetch();
      return tx;
    },
    [agent?.access, refetch, updateMetadata, updateProfile]
  );

  return {
    agent,
    loading,
    error,
    refetch,
    bindBoardSession,
    hasAgent: !!agent,
  };
}
