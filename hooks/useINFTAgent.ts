"use client";

import {
  useAccount,
  useSwitchChain,
  usePublicClient,
  useWriteContract,
} from "wagmi";
import { AGENT_ADDRESSES, ZERO_G_CHAIN_IDS } from "@/lib/addresses";
import { zeroGTestnet } from "@/lib/wagmi/config";
import { INFT_AGENT_ABI } from "@/lib/INFTAgentAbi";

export function useINFTAgent() {
  const { chainId, isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const ensureChain = async () => {
    if (!isConnected) throw new Error("Wallet not connected");
    const supported = ZERO_G_CHAIN_IDS as readonly number[];
    if (!chainId || !supported.includes(chainId)) {
      await switchChainAsync({ chainId: zeroGTestnet.id });
    }
  };

  const getAgentAddress = () => {
    const activeChain =
      chainId && AGENT_ADDRESSES[chainId] ? chainId : zeroGTestnet.id;
    const address = AGENT_ADDRESSES[activeChain] as `0x${string}` | undefined;
    if (!address) throw new Error(`No Agentic ID contract for chain ${activeChain}`);
    return address;
  };

  const mintAgent = async ({
    vault,
    encryptedHash,
    domain,
    embeddingURI,
    aiSignature,
  }: {
    vault: `0x${string}`;
    encryptedHash: `0x${string}`;
    domain: string;
    embeddingURI: string;
    aiSignature: string;
  }) => {
    await ensureChain();
    const address = getAgentAddress();

    const txHash = await writeContractAsync({
      abi: INFT_AGENT_ABI,
      address,
      functionName: "mintAgent",
      args: [vault, encryptedHash, domain, embeddingURI, aiSignature],
    });

    await publicClient!.waitForTransactionReceipt({ hash: txHash });
    return txHash;
  };

  const getAgentProfile = async (tokenId: bigint) => {
    return await publicClient!.readContract({
      abi: INFT_AGENT_ABI,
      address: getAgentAddress(),
      functionName: "getAgentProfile",
      args: [tokenId],
    });
  };

  const getEncryptedMetadata = async (tokenId: bigint) => {
    return await publicClient!.readContract({
      abi: INFT_AGENT_ABI,
      address: getAgentAddress(),
      functionName: "getEncryptedMetadata",
      args: [tokenId],
    });
  };

  const updateMetadata = async (tokenId: bigint, newEncryptedHash: `0x${string}`) => {
    await ensureChain();
    const txHash = await writeContractAsync({
      abi: INFT_AGENT_ABI,
      address: getAgentAddress(),
      functionName: "updateMetadata",
      args: [tokenId, newEncryptedHash],
    });
    await publicClient!.waitForTransactionReceipt({ hash: txHash });
    return txHash;
  };

  const updateProfile = async (
    tokenId: bigint,
    embeddingURI: string,
    aiSignature: string
  ) => {
    await ensureChain();
    const txHash = await writeContractAsync({
      abi: INFT_AGENT_ABI,
      address: getAgentAddress(),
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
