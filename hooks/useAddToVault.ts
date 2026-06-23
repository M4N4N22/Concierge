"use client";

import { useAccount, useSwitchChain, usePublicClient, useWriteContract } from "wagmi";
import { zeroGMainnet, zeroGTestnet } from "@/lib/wagmi/config";
import { VAULT_ADDRESSES } from "@/lib/addresses";

export function useAddToVault() {
  const { chainId, isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const ensureChain = async (targetChainId: number) => {
    if (!isConnected) throw new Error("Wallet not connected");
    if (chainId !== targetChainId) {
      await switchChainAsync({ chainId: targetChainId });
    }
  };

  const addFile = async ({
    rootHash,
    category = "unassigned",
    encryptedKey = "",
    insightsCID,
    useTestnet = true,
  }: {
    rootHash: string;
    category?: string;
    encryptedKey?: string;
    insightsCID: string;
    useTestnet?: boolean;
  }) => {
    const network = useTestnet ? zeroGTestnet : zeroGMainnet;
    await ensureChain(network.id);

    const vaultAddress = VAULT_ADDRESSES[network.id] as `0x${string}` | undefined;
    if (!vaultAddress) {
      throw new Error(`Vault not configured for chain ${network.id}`);
    }

    const { VAULT_ABI } = await import("@/lib/vaultAbi");

    const txHash = await writeContractAsync({
      abi: VAULT_ABI,
      address: vaultAddress,
      functionName: "addFile",
      args: [rootHash, category, encryptedKey, insightsCID],
      chainId: network.id,
    });

    await publicClient!.waitForTransactionReceipt({ hash: txHash });
    return txHash;
  };

  return { addFile };
}
