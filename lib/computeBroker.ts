import { createZGComputeNetworkBroker } from "@0gfoundation/0g-compute-ts-sdk";
import { ethers } from "ethers";
import { zeroGMainnet, zeroGTestnet } from "@/lib/wagmi/config";

export type ComputeBrokerConfig = {
  chainId: number;
  rpcUrl: string;
  privateKey: string;
  isTestnet: boolean;
  networkName: string;
};

/** Resolve compute broker RPC + key from wallet chain (mainnet vs Galileo). */
export function resolveComputeBrokerConfig(
  chainId?: number | null
): ComputeBrokerConfig {
  const id =
    chainId === zeroGMainnet.id || chainId === zeroGTestnet.id
      ? chainId
      : zeroGTestnet.id;

  if (id === zeroGMainnet.id) {
    const rpcUrl =
      process.env.OG_MAINNET_RPC_URL ||
      process.env.NEXT_PUBLIC_OG_MAINNET_RPC_URL;
    const privateKey = process.env.OG_MAINNET_PRIVATE_KEY;
    if (!rpcUrl || !privateKey) {
      throw new Error(
        "Missing OG_MAINNET_RPC_URL or OG_MAINNET_PRIVATE_KEY for mainnet compute"
      );
    }
    return {
      chainId: id,
      rpcUrl,
      privateKey,
      isTestnet: false,
      networkName: "0G Mainnet",
    };
  }

  const rpcUrl =
    process.env.GALILEO_RPC_URL || process.env.NEXT_PUBLIC_GALILEO_RPC_URL;
  const privateKey = process.env.GALILEO_PRIVATE_KEY;
  if (!rpcUrl || !privateKey) {
    throw new Error(
      "Missing GALILEO_RPC_URL or GALILEO_PRIVATE_KEY for testnet compute"
    );
  }
  return {
    chainId: zeroGTestnet.id,
    rpcUrl,
    privateKey,
    isTestnet: true,
    networkName: "0G Galileo Testnet",
  };
}

export function parseComputeChainId(raw: unknown): number | undefined {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && /^\d+$/.test(raw)) return Number(raw);
  return undefined;
}

export async function createComputeBroker(chainId?: number | null) {
  const cfg = resolveComputeBrokerConfig(chainId);
  const provider = new ethers.JsonRpcProvider(cfg.rpcUrl);
  const signer = new ethers.Wallet(cfg.privateKey, provider);
  const broker = await createZGComputeNetworkBroker(signer);
  return { broker, signer, provider, cfg };
}
