// hooks/useUserFiles.ts
import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { createPublicClient, http } from "viem";
import { zeroGGalileo, VAULT_ADDRESS } from "@/lib/contractClient";
import { VAULT_ABI } from "@/lib/vaultAbi";
import { toast } from "sonner";

const client = createPublicClient({
  chain: zeroGGalileo,
  transport: http(zeroGGalileo.rpcUrls.default.http[0]),
});

export interface VaultFile {
  rootHash: string;    // keep as hex
  category: string;
  insightsCID: string; // keep as hex
  timestamp: number;
}

export function useUserFiles() {
  const { address: userAddress, isConnected } = useAccount();
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFiles = useCallback(async () => {
    console.log("Fetching user files...", { userAddress, isConnected });

    if (!isConnected || !userAddress) {
      toast.error("Wallet not connected.");
      setFiles([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      console.log("Calling viewFilesByUser on contract...");
      const rawResult = await client.readContract({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "viewFilesByUser",
        args: [userAddress],
      });
      console.log("Raw contract call result:", rawResult);

      if (!rawResult || (Array.isArray(rawResult) && rawResult.length === 0)) {
        toast.info("You have not uploaded any files yet.");
        setFiles([]);
      } else {
        const mapped: VaultFile[] = (rawResult as any[]).map((f: any) => ({
          rootHash: f.fileHash,       // keep raw hex
          category: f.category,
          insightsCID: f.insightsCID, // keep raw hex
          timestamp: Number(f.timestamp),
        }));
        console.log("Mapped files:", mapped);
        setFiles(mapped);
      }
    } catch (err: any) {
      console.error("Error fetching user files:", err);
      toast.error(
        err?.reason || "Failed to fetch your files. Make sure contract is deployed correctly."
      );
      setFiles([]);
    } finally {
      setLoading(false);
      console.log("Fetch complete");
    }
  }, [userAddress, isConnected]);

  return { files, loading, refetch: fetchFiles };
}
