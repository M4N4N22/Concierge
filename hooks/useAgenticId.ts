"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { AGENT_ADDRESSES, ZERO_G_CHAIN_IDS } from "@/lib/addresses";
import { INFT_AGENT_ABI } from "@/lib/INFTAgentAbi";
import { zeroGTestnet } from "@/lib/wagmi/config";
import { useINFTAgent } from "@/hooks/useINFTAgent";

export type MyAgenticId = {
  tokenId: bigint;
  domain: string;
  vault: `0x${string}`;
  embeddingURI: string;
  aiSignature: string;
};

export function useAgenticId() {
  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient();
  const { updateProfile, updateMetadata } = useINFTAgent();
  const [agent, setAgent] = useState<MyAgenticId | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAgentAddress = useCallback(() => {
    const activeChain =
      chainId && AGENT_ADDRESSES[chainId] ? chainId : zeroGTestnet.id;
    const addr = AGENT_ADDRESSES[activeChain] as `0x${string}` | undefined;
    if (!addr) throw new Error(`No Agentic ID contract for chain ${activeChain}`);
    return addr;
  }, [chainId]);

  const refetch = useCallback(async () => {
    if (!isConnected || !address || !publicClient) {
      setAgent(null);
      return null;
    }

    const supported = ZERO_G_CHAIN_IDS as readonly number[];
    if (chainId && !supported.includes(chainId)) {
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

      if (!tokenId || tokenId === 0n) {
        setAgent(null);
        return null;
      }

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

      const embeddingURI = Array.isArray(profile)
        ? profile[0]
        : profile.embeddingURI;
      const aiSignature = Array.isArray(profile)
        ? profile[1]
        : profile.aiSignature;

      const next: MyAgenticId = {
        tokenId,
        domain,
        vault,
        embeddingURI,
        aiSignature,
      };
      setAgent(next);
      return next;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load Agentic ID";
      setError(message);
      setAgent(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [address, chainId, getAgentAddress, isConnected, publicClient]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  /** Point Agentic ID profile at the latest board transcript + guard seal. */
  const bindBoardSession = useCallback(
    async (args: {
      tokenId: bigint;
      transcriptRootHash: string;
      sealHash: `0x${string}`;
    }) => {
      const embeddingURI = `0g://board/${args.transcriptRootHash}`;
      const aiSignature = `guard:${args.sealHash}`;
      const tx = await updateProfile(args.tokenId, embeddingURI, aiSignature);
      // Also fingerprint metadata with seal hash for lineage
      try {
        await updateMetadata(args.tokenId, args.sealHash);
      } catch {
        // profile bind is enough if metadata update fails
      }
      await refetch();
      return tx;
    },
    [refetch, updateMetadata, updateProfile]
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
