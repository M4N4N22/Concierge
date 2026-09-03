"use client";

import {
  useAccount,
  useSwitchChain,
  usePublicClient,
  useWriteContract,
} from "wagmi";
import { AGENT_ADDRESSES, ZERO_G_CHAIN_IDS } from "@/lib/addresses";
import { zeroGMainnet, zeroGTestnet } from "@/lib/wagmi/config";
import { INFT_AGENT_ABI } from "@/lib/INFTAgentAbi";
import { zeroGFeeOverrides } from "@/lib/zeroGGas";

export function useINFTAgent() {
  const { chainId, isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const ensureChain = async () => {
    if (!isConnected) throw new Error("Wallet not connected");
    const supported = ZERO_G_CHAIN_IDS as readonly number[];
    if (chainId && supported.includes(chainId)) return;
    // Prefer staying on mainnet if the wallet was already there; else Galileo.
    const fallback =
      chainId === zeroGMainnet.id ? zeroGMainnet.id : zeroGTestnet.id;
    await switchChainAsync({ chainId: fallback });
  };

  const getAgentAddress = () => {
    const activeChain =
      chainId && AGENT_ADDRESSES[chainId] ? chainId : zeroGTestnet.id;
    const address = AGENT_ADDRESSES[activeChain] as `0x${string}` | undefined;
    if (!address) throw new Error(`No Agentic ID contract for chain ${activeChain}`);
    return { address, chainId: activeChain };
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
    const { address, chainId: activeChain } = getAgentAddress();
    const fees = await zeroGFeeOverrides(publicClient, activeChain);

    const txHash = await writeContractAsync({
      abi: INFT_AGENT_ABI,
      address,
      functionName: "mintAgent",
      args: [vault, encryptedHash, domain, embeddingURI, aiSignature],
      chainId: activeChain,
      ...fees,
    });

    await publicClient!.waitForTransactionReceipt({ hash: txHash });
    return txHash;
  };

  const getAgentProfile = async (tokenId: bigint) => {
    const { address } = getAgentAddress();
    return await publicClient!.readContract({
      abi: INFT_AGENT_ABI,
      address,
      functionName: "getAgentProfile",
      args: [tokenId],
    });
  };

  const getEncryptedMetadata = async (tokenId: bigint) => {
    const { address } = getAgentAddress();
    return await publicClient!.readContract({
      abi: INFT_AGENT_ABI,
      address,
      functionName: "getEncryptedMetadata",
      args: [tokenId],
    });
  };

  const updateMetadata = async (
    tokenId: bigint,
    newEncryptedHash: `0x${string}`
  ) => {
    await ensureChain();
    const { address, chainId: activeChain } = getAgentAddress();
    const fees = await zeroGFeeOverrides(publicClient, activeChain);

    const txHash = await writeContractAsync({
      abi: INFT_AGENT_ABI,
      address,
      functionName: "updateMetadata",
      args: [tokenId, newEncryptedHash],
      chainId: activeChain,
      ...fees,
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
    const { address, chainId: activeChain } = getAgentAddress();
    const fees = await zeroGFeeOverrides(publicClient, activeChain);

    const txHash = await writeContractAsync({
      abi: INFT_AGENT_ABI,
      address,
      functionName: "updateProfile",
      args: [tokenId, embeddingURI, aiSignature],
      chainId: activeChain,
      ...fees,
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
