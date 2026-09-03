import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { walletConnect } from "wagmi/connectors";

export const zeroGTestnet = {
  id: 16602,
  name: "0G-Galileo-Testnet",
  nativeCurrency: { name: "OG", symbol: "OG", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://evmrpc-testnet.0g.ai"] },
  },
  blockExplorers: {
    default: { name: "Chainscan", url: "https://chainscan-galileo.0g.ai" },
  },
  testnet: true,
};

export const zeroGMainnet = {
  id: 16661,
  name: "0G-Mainnet",
  nativeCurrency: { name: "OG", symbol: "OG", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://evmrpc.0g.ai"] },
  },
  blockExplorers: {
    default: { name: "Chainscan", url: "https://chainscan.0g.ai"},
  },
  testnet: false,
};

export const config = createConfig({
  chains: [zeroGTestnet, zeroGMainnet],
  connectors: [
    injected(),
    walletConnect({ projectId: "4f5debd278149b12b8dbfe62a53aa9e0" }),
  ],
  transports: {
    [zeroGMainnet.id]: http("https://evmrpc.0g.ai"),
    [zeroGTestnet.id]: http("https://evmrpc-testnet.0g.ai"),
  },
});

export const SUPPORTED_CHAINS = [zeroGTestnet, zeroGMainnet] as const;

export function networkShortLabel(chainId: number): string {
  if (chainId === zeroGMainnet.id) return "Mainnet";
  if (chainId === zeroGTestnet.id) return "Galileo";
  return "Unknown";
}

export function networkDisplayLabel(chainId: number): string {
  if (chainId === zeroGMainnet.id) return "0G Mainnet";
  if (chainId === zeroGTestnet.id) return "Galileo Testnet";
  return `Chain ${chainId}`;
}
