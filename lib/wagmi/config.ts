import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { walletConnect } from "wagmi/connectors";
import { mainnet } from "wagmi/chains";


const zeroGTestnet = {
  id: 16601,
  name: "0G-Galileo-Testnet",
  nativeCurrency: { name: "OG", symbol: "OG", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://evmrpc-testnet.0g.ai"] },
    public: { http: ["https://evmrpc-testnet.0g.ai"] },
  },
  blockExplorers: {
    default: { name: "Chainscan", url: "https://chainscan-galileo.0g.ai" },
  },
  testnet: true,
};

export const config = createConfig({
  chains: [zeroGTestnet],
  connectors: [
    injected(),
    walletConnect({ projectId: "4f5debd278149b12b8dbfe62a53aa9e0" }),
  ],
  transports: {
    [zeroGTestnet.id]: http("https://evmrpc-testnet.0g.ai"),
  },
});
