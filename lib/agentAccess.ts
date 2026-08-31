import {
  createPublicClient,
  http,
  type Address,
} from "viem";
import {
  AGENT_ADDRESSES,
  MARKETPLACE_ADDRESSES,
  ZERO_G_CHAIN_IDS,
} from "@/lib/addresses";
import { AGENT_MARKETPLACE_ABI } from "@/lib/marketplaceAbi";
import { zeroGMainnet, zeroGTestnet } from "@/lib/wagmi/config";

const ERC721_OWNER_ABI = [
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ type: "address" }],
  },
] as const;

function isContractAddress(v: string | undefined): v is string {
  return !!v && /^0x[a-fA-F0-9]{40}$/.test(v);
}

function rpcFor(chainId: number): string | null {
  if (chainId === zeroGMainnet.id) return zeroGMainnet.rpcUrls.default.http[0];
  if (chainId === zeroGTestnet.id) return zeroGTestnet.rpcUrls.default.http[0];
  return null;
}

export function resolveAgentChainId(preferred?: number): number | null {
  if (
    preferred &&
    (ZERO_G_CHAIN_IDS as readonly number[]).includes(preferred) &&
    isContractAddress(AGENT_ADDRESSES[preferred])
  ) {
    return preferred;
  }
  for (const id of ZERO_G_CHAIN_IDS) {
    if (isContractAddress(AGENT_ADDRESSES[id])) return id;
  }
  return null;
}

/**
 * Owner or active marketplace renter may use the agent for board / bind flows.
 * Falls back to NFT ownerOf when marketplace is not configured on the chain.
 */
export async function walletHasAgentAccess(args: {
  wallet: Address;
  tokenId: bigint;
  chainId?: number;
}): Promise<{ ok: true; chainId: number } | { ok: false; error: string }> {
  const chainId = resolveAgentChainId(args.chainId);
  if (!chainId) {
    return { ok: false, error: "Agent contract not configured" };
  }
  const rpc = rpcFor(chainId);
  if (!rpc) {
    return { ok: false, error: `No RPC for chain ${chainId}` };
  }

  const client = createPublicClient({
    transport: http(rpc),
  });

  const agent = AGENT_ADDRESSES[chainId] as Address;
  const market = MARKETPLACE_ADDRESSES[chainId];

  try {
    if (isContractAddress(market)) {
      const access = (await client.readContract({
        address: market as Address,
        abi: AGENT_MARKETPLACE_ABI,
        functionName: "hasAccess",
        args: [args.tokenId, args.wallet],
      })) as boolean;
      if (!access) {
        return {
          ok: false,
          error:
            "No board access for this Agentic ID — own it or rent an active lease",
        };
      }
      return { ok: true, chainId };
    }

    const owner = (await client.readContract({
      address: agent,
      abi: ERC721_OWNER_ABI,
      functionName: "ownerOf",
      args: [args.tokenId],
    })) as Address;
    if (owner.toLowerCase() !== args.wallet.toLowerCase()) {
      return { ok: false, error: "Wallet is not the Agentic ID owner" };
    }
    return { ok: true, chainId };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "Failed to verify Agentic ID access",
    };
  }
}

export function parseAgentTokenId(raw: unknown): bigint | null {
  if (typeof raw === "string" && /^\d+$/.test(raw)) return BigInt(raw);
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
    return BigInt(Math.floor(raw));
  }
  return null;
}

export function isConfiguredContract(
  map: Record<number, string>,
  chainId: number | undefined
): string | null {
  if (!chainId) return null;
  const a = map[chainId];
  return isContractAddress(a) ? a : null;
}
