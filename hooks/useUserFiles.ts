// hooks/useUserFiles.ts
import { useState, useCallback } from "react";
import { useAccount, useChainId } from "wagmi";
import { createPublicClient, http } from "viem";
import { VAULT_ABI } from "@/lib/vaultAbi";
import { VAULT_ADDRESSES } from "@/lib/addresses";
import { zeroGMainnet, zeroGTestnet } from "@/lib/wagmi/config"; // adjust path as needed
import { toast } from "sonner";

export interface VaultFile {
  rootHash: string;
  category: string;
  insightsCID: string;
  timestamp: number;
}

export function useUserFiles() {
  const { address: userAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFiles = useCallback(async () => {
    console.log("Fetching user files...", {
      userAddress,
      isConnected,
      chainId,
    });

    if (!isConnected || !userAddress) {
      toast.error("Wallet not connected.");
      setFiles([]);
      setLoading(false);
      return;
    }

    const vaultAddress = VAULT_ADDRESSES[chainId];
    if (!vaultAddress) {
      toast.error(`No vault contract deployed for chain ID ${chainId}`);
      return;
    }
    const vault = vaultAddress as `0x${string}`;

    // Select correct chain + RPC from wagmi config
    const chain = chainId === zeroGMainnet.id ? zeroGMainnet : zeroGTestnet;

    const client = createPublicClient({
      chain,
      transport: http(chain.rpcUrls.default.http[0]),
    });

    try {
      setLoading(true);

      console.log(`Calling viewFilesByUser on ${vaultAddress}...`);
      const rawResult = await client.readContract({
        address: vault,
        abi: VAULT_ABI,
        functionName: "viewFilesByUser",
        args: [userAddress],
      });

      console.log("Raw result:", rawResult);
      type FileStruct = {
        fileHash: string;
        category: string;
        insightsCID: string;
        timestamp: bigint;
      };

      const result = rawResult as FileStruct[];

      console.log("Raw result:", result);

      if (!result || result.length === 0) {
        setFiles([]);
        return toast.info("No files uploaded yet.");
      }

      const mapped = result.map((f) => ({
        rootHash: f.fileHash,
        category: f.category,
        insightsCID: f.insightsCID,
        timestamp: Number(f.timestamp),
      }));

      console.log("Mapped files:", mapped);
      setFiles(mapped);
    } catch (err: any) {
      console.error("Error fetching user files:", err);
      toast.error(err?.reason || "Failed to fetch files.");
      setFiles([]);
    } finally {
      setLoading(false);
      console.log("Fetch complete.");
    }
  }, [userAddress, isConnected, chainId]);

  return { files, loading, refetch: fetchFiles };
}
