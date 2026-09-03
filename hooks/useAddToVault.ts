"use client";

import { useAccount, useSwitchChain, usePublicClient, useWriteContract } from "wagmi";
import { zeroGMainnet, zeroGTestnet } from "@/lib/wagmi/config";
import { VAULT_ADDRESSES } from "@/lib/addresses";
import { zeroGFeeOverrides } from "@/lib/zeroGGas";

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
    useTestnet,
  }: {
    rootHash: string;
    category?: string;
    encryptedKey?: string;
    insightsCID: string;
    /** When omitted, uses the wallet's current 0G network. */
    useTestnet?: boolean;
  }) => {
    const network =
      typeof useTestnet === "boolean"
        ? useTestnet
          ? zeroGTestnet
          : zeroGMainnet
        : chainId === zeroGMainnet.id
          ? zeroGMainnet
          : chainId === zeroGTestnet.id
            ? zeroGTestnet
            : null;

    if (!network) {
      throw new Error("Switch wallet to 0G Mainnet or Galileo before saving");
    }

    await ensureChain(network.id);

    const vaultAddress = VAULT_ADDRESSES[network.id] as `0x${string}` | undefined;
    if (!vaultAddress) {
      throw new Error(`Vault not configured for chain ${network.id}`);
    }

    const { VAULT_ABI } = await import("@/lib/vaultAbi");
    const fees = await zeroGFeeOverrides(publicClient, network.id);

    const txHash = await writeContractAsync({
      abi: VAULT_ABI,
      address: vaultAddress,
      functionName: "addFile",
      args: [rootHash, category, encryptedKey, insightsCID],
      chainId: network.id,
      ...fees,
    });

    await publicClient!.waitForTransactionReceipt({ hash: txHash });
    return txHash;
  };

  const updateInsights = async ({
    rootHash,
    category,
    insightsCID,
  }: {
    rootHash: string;
    category: string;
    insightsCID: string;
  }) => {
    if (!isConnected || !chainId) throw new Error("Wallet not connected");

    const vaultAddress = VAULT_ADDRESSES[chainId] as `0x${string}` | undefined;
    if (!vaultAddress) {
      throw new Error(`Vault not configured for chain ${chainId}`);
    }

    const { VAULT_ABI } = await import("@/lib/vaultAbi");
    const fees = await zeroGFeeOverrides(publicClient, chainId);

    const txHash = await writeContractAsync({
      abi: VAULT_ABI,
      address: vaultAddress,
      functionName: "updateInsights",
      args: [rootHash, category, insightsCID],
      chainId,
      ...fees,
    });

    await publicClient!.waitForTransactionReceipt({ hash: txHash });
    return txHash;
  };

  return { addFile, updateInsights };
}
