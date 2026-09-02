import { createPublicClient, http, type Address, type PublicClient } from "viem";
import { VAULT_ABI } from "@/lib/vaultAbi";
import { VAULT_ADDRESSES } from "@/lib/addresses";
import { zeroGMainnet, zeroGTestnet } from "@/lib/wagmi/config";
import type { VaultFile } from "@/hooks/useUserFiles";
import { mapVaultFiles } from "@/lib/vault/mapVaultFiles";

export async function fetchVaultFilesForUser(args: {
  chainId: number;
  userAddress: Address;
  publicClient?: PublicClient;
}): Promise<VaultFile[]> {
  const vaultAddress = VAULT_ADDRESSES[args.chainId];
  if (!vaultAddress) return [];

  const client =
    args.publicClient ??
    createPublicClient({
      chain: args.chainId === zeroGMainnet.id ? zeroGMainnet : zeroGTestnet,
      transport: http(
        (args.chainId === zeroGMainnet.id ? zeroGMainnet : zeroGTestnet).rpcUrls
          .default.http[0]
      ),
    });

  const rawResult = await client.readContract({
    address: vaultAddress as Address,
    abi: VAULT_ABI,
    functionName: "viewFilesByUser",
    args: [args.userAddress],
  });

  return mapVaultFiles(rawResult as Parameters<typeof mapVaultFiles>[0]);
}
