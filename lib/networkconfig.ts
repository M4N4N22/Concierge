const NETWORK_CONFIG: Record<number, {
    rpcUrl: string;
    indexerUrl: string;
    vaultAddress: string;
    privateKey?: string;
  }> = {
    16661: { // MAINNET
      rpcUrl: process.env.OG_MAINNET_RPC_URL!,
      indexerUrl: process.env.OG_MAINNET_INDEXER_RPC_URL!,
      vaultAddress: process.env.NEXT_PUBLIC_VAULT_ADDRESS!,
      privateKey: process.env.OG_MAINNET_PRIVATE_KEY,
    },
    16602: { // TESTNET
      rpcUrl: process.env.GALILEO_RPC_URL!,
      indexerUrl: process.env.INDEXER_RPC_URL!,
      vaultAddress: process.env.NEXT_PUBLIC_VAULT_ADDRESS!,
      privateKey: process.env.GALILEO_PRIVATE_KEY,
    },
  };
  
  export function get0gConfig(chainId: number) {
    const config = NETWORK_CONFIG[chainId];
    if (!config) {
      throw new Error(`Unsupported chainId: ${chainId}`);
    }
    return config;
  }
  