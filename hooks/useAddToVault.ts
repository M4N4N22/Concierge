"use client";

import { useAccount, useSwitchChain, usePublicClient, useWriteContract } from "wagmi";
import { zeroGGalileo, VAULT_ADDRESS } from "@/lib/contractClient";
import { keccak256, toHex } from "viem";

export function useAddToVault() {
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

  const addFile = async ({
    rootHash,
    category = "unassigned",
    encryptedKey = "",
    insightsCID,
  }: {
    rootHash: string;
    category?: string;
    encryptedKey?: string;
    insightsCID: string;
  }) => {
    await ensureChain();

    const fileHashB32 = rootHash;  
    const insightsB32 = insightsCID; 
    
    console.log("fileHashB32:", rootHash);
    console.log("insightsB32:", insightsCID);

    const txHash = await writeContractAsync({
      abi: (await import("@/lib/vaultAbi")).VAULT_ABI,
      address: (await import("@/lib/contractClient")).VAULT_ADDRESS,
      functionName: "addFile",
      args: [fileHashB32, category, encryptedKey, insightsB32],
    });

    console.log("Transaction hash:", txHash);

    await publicClient!.waitForTransactionReceipt({ hash: txHash });
    console.log("Transaction confirmed:", txHash);

    return txHash;
  };

  return { addFile };
}
