// hooks/useINFTAgent.ts
"use client";

import {
  useAccount,
  useSwitchChain,
  usePublicClient,
  useWriteContract,
} from "wagmi";
import { zeroGGalileo } from "@/lib/contractClient";
import { INFT_AGENT_ABI,INFT_AGENT_ADDRESS } from "@/lib/INFTAgentAbi";

export function useINFTAgent() {
  const { chainId, isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const ensureChain = async () => {
    if (!isConnected) throw new Error("Wallet not connected");
    if (chainId !== zeroGGalileo.id) {
      await switchChainAsync({ chainId: zeroGGalileo.id });
    }
  };

  //Mint Agent
  const mintAgent = async ({
    vault,
    encryptedHash,
    domain,
    embeddingURI,
    aiSignature,
  }: {
    vault: `0x${string}`;
    encryptedHash: `0x${string}`; // bytes32 hash
    domain: string;
    embeddingURI: string;
    aiSignature: string;
  }) => {
    await ensureChain();

    const txHash = await writeContractAsync({
      abi: INFT_AGENT_ABI,
      address: INFT_AGENT_ADDRESS,
      functionName: "mintAgent",
      args: [vault, encryptedHash, domain, embeddingURI, aiSignature],
    });

    await publicClient!.waitForTransactionReceipt({ hash: txHash });
    return txHash;
  };

  //Read Agent Profile
  const getAgentProfile = async (tokenId: bigint) => {
    return await publicClient!.readContract({
      abi: INFT_AGENT_ABI,
      address: INFT_AGENT_ADDRESS,
      functionName: "getAgentProfile",
      args: [tokenId],
    });
  };

  // Read Encrypted Metadata
  const getEncryptedMetadata = async (tokenId: bigint) => {
    return await publicClient!.readContract({
      abi: INFT_AGENT_ABI,
      address: INFT_AGENT_ADDRESS,
      functionName: "getEncryptedMetadata",
      args: [tokenId],
    });
  };

  // Update Metadata
  const updateMetadata = async (tokenId: bigint, newEncryptedHash: `0x${string}`) => {
    await ensureChain();

    const txHash = await writeContractAsync({
      abi: INFT_AGENT_ABI,
      address: INFT_AGENT_ADDRESS,
      functionName: "updateMetadata",
      args: [tokenId, newEncryptedHash],
    });

    await publicClient!.waitForTransactionReceipt({ hash: txHash });
    return txHash;
  };

  // ✅ Update Profile
  const updateProfile = async (
    tokenId: bigint,
    embeddingURI: string,
    aiSignature: string
  ) => {
    await ensureChain();

    const txHash = await writeContractAsync({
      abi: INFT_AGENT_ABI,
      address: INFT_AGENT_ADDRESS,
      functionName: "updateProfile",
      args: [tokenId, embeddingURI, aiSignature],
    });

    await publicClient!.waitForTransactionReceipt({ hash: txHash });
    return txHash;
  };

  return {
    mintAgent,
    getAgentProfile,
    getEncryptedMetadata,
    updateMetadata,
    updateProfile,
  };
}
