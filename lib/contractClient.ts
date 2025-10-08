// lib/contractClient.ts
import type { Address, Hex } from "viem";
import { hexToBytes, toHex } from "viem";
import { VAULT_ABI } from "@/lib/vaultAbi"; // export ABI here
export const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS as Address;

// If your 0G "rootHash" is a string/CID-ish value, we keep your earlier utf8→bytes32 padding.
export function rootHashToBytes32(rootHash: string): Hex {
  const utf8 = new TextEncoder().encode(rootHash);
  if (utf8.length > 32) throw new Error("String too long for bytes32");
  const padded = new Uint8Array(32);
  padded.set(utf8);
  return toHex(padded);
}

// 0G Galileo chain (wagmi/viem)
import type { Chain } from "viem";
export const zeroGGalileo: Chain = {
  id: 16602,
  name: "0G Galileo Testnet",
  nativeCurrency: { name: "OG", symbol: "OG", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_GALILEO_RPC_URL!] },
    public: { http: [process.env.NEXT_PUBLIC_GALILEO_RPC_URL!] },
  },
  blockExplorers: {
    default: { name: "Chainscan", url: "https://chainscan-galileo.0g.ai" },
  },
};
