"use client";

import {
  useAccount,
  useSwitchChain,
  usePublicClient,
  useWriteContract,
} from "wagmi";
import { zeroGMainnet, zeroGTestnet } from "@/lib/wagmi/config";
import { VAULT_ADDRESSES } from "@/lib/addresses";

export function useAddToVault() {
  const { chainId, isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  // Select the current or fallback network
  const getCurrentNetwork = () => {
    if (chainId === zeroGMainnet.id) return zeroGMainnet;
    if (chainId === zeroGTestnet.id) return zeroGTestnet;
    return zeroGMainnet; // fallback
  };

  const ensureChain = async (targetChainId?: number) => {
    if (!isConnected) throw new Error("Wallet not connected");

    const desiredChainId = targetChainId ?? getCurrentNetwork().id;
    if (chainId !== desiredChainId) {
      await switchChainAsync({ chainId: desiredChainId });
    }
  };

  const addFile = async ({
    rootHash,
    category = "unassigned",
    encryptedKey = "",
    insightsCID,
    useTestnet = false,
  }: {
    rootHash: string;
    category?: string;
    encryptedKey?: string;
    insightsCID: string;
    useTestnet?: boolean;
  }) => {
    const network = useTestnet ? zeroGTestnet : zeroGMainnet;
    await ensureChain(network.id);

    const { VAULT_ABI } = await import("@/lib/vaultAbi");

    // Ensure chainId is defined before indexing
    const activeChainId = chainId ?? network.id;
    const vaultAddress = VAULT_ADDRESSES[activeChainId] as `0x${string}`;

    if (!vaultAddress) {
      throw new Error(`Vault address not found for chainId: ${activeChainId}`);
    }

    console.log("Network:", useTestnet ? "Testnet" : "Mainnet");
    console.log("Vault Address:", vaultAddress);
    console.log("fileHashB32:", rootHash);
    console.log("insightsB32:", insightsCID);

    const txHash = await writeContractAsync({
      abi: VAULT_ABI,
      address: vaultAddress,
      functionName: "addFile",
      args: [rootHash, category, encryptedKey, insightsCID],
    });

    console.log("Transaction hash:", txHash);

    await publicClient!.waitForTransactionReceipt({ hash: txHash });
    console.log("Transaction confirmed:", txHash);

    return txHash;
  };

  return { addFile };
}
