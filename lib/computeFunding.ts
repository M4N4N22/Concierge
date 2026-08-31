import { MIN_LEDGER_CREATE_OG } from "@/lib/computeConstants";

export type ComputeNetworkInfo = {
  chainId: number;
  name: string;
  isTestnet: boolean;
  explorerUrl: string;
};

export function networkFromChainId(chainId: number): ComputeNetworkInfo {
  if (chainId === 16661) {
    return {
      chainId,
      name: "0G Mainnet",
      isTestnet: false,
      explorerUrl: "https://chainscan.0g.ai",
    };
  }
  return {
    chainId: chainId || 16602,
    name: "0G Galileo Testnet",
    isTestnet: true,
    explorerUrl: "https://chainscan-galileo.0g.ai",
  };
}

export type FundingLink = {
  label: string;
  href: string;
  external?: boolean;
};

/** Where to get OG when the broker wallet is short of the ledger create minimum. */
export function getOgFundingLinks(isTestnet: boolean): FundingLink[] {
  if (isTestnet) {
    return [
      {
        label: "0G Faucet",
        href: "https://faucet.0g.ai/",
        external: true,
      },
      {
        label: "0G Discord",
        href: "https://discord.com/invite/0glabs",
        external: true,
      },
      {
        label: "Docs · get testnet OG",
        href: "https://docs.0g.ai/developer-hub/testnet/testnet-overview",
        external: true,
      },
    ];
  }
  return [
    {
      label: "get.0g.ai — buy guide",
      href: "https://get.0g.ai/",
      external: true,
    },
    {
      label: "0G Hub Swap",
      href: "https://hub.0g.ai/swap",
      external: true,
    },
    {
      label: "Concierge Desk (OG/USDC)",
      href: "/dashboard/trading/desk",
      external: false,
    },
  ];
}

export function shortfallForCreate(nativeBalanceOg: number): number {
  return Math.max(0, MIN_LEDGER_CREATE_OG - nativeBalanceOg);
}
