export const VAULT_ADDRESSES: Record<number, string> = {
  16661: process.env.NEXT_PUBLIC_MAINNET_VAULT_ADDRESS as string,
  16602: process.env.NEXT_PUBLIC_VAULT_ADDRESS as string,
};

export const AGENT_ADDRESSES: Record<number, string> = {
  16661: process.env.NEXT_PUBLIC_INFTAGENT_ADDRESS as string,
  16602:
    (process.env.NEXT_PUBLIC_INFTAGENT_TESTNET_ADDRESS ||
      process.env.NEXT_PUBLIC_INFTAGENT_ADDRESS) as string,
};

export const ZERO_G_CHAIN_IDS = [16661, 16602] as const;
  