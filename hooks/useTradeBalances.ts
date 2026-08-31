"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount, useBalance, usePublicClient } from "wagmi";
import { formatUnits, type Address } from "viem";
import { ERC20_ABI, getDexConfig } from "@/lib/trade/dex";

export type TokenBalanceRow = {
  id: string;
  symbol: string;
  label: string;
  balance: string;
  raw: bigint;
  decimals: number;
  /** Can be spent as input on the live OG/USDC desk */
  spendable: boolean;
  note?: string;
};

/**
 * Native OG + W0G, USDC, WETH for the connected wallet on the active chain.
 * Live swaps still use OG/USDC only; WETH is portfolio context.
 */
export function useTradeBalances() {
  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient();
  const { data: nativeBal, isLoading: nativeLoading } = useBalance({ address });
  const [erc20, setErc20] = useState<{
    w0g: bigint;
    usdc: bigint;
    weth: bigint;
  } | null>(null);
  const [loadingErc20, setLoadingErc20] = useState(false);

  const dex = useMemo(
    () => (chainId ? getDexConfig(chainId) : null),
    [chainId]
  );

  const refresh = useCallback(async () => {
    if (!address || !publicClient || !dex) {
      setErc20(null);
      return;
    }
    setLoadingErc20(true);
    try {
      const [w0g, usdc, weth] = await Promise.all([
        publicClient.readContract({
          address: dex.wNative.address,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [address as Address],
        }) as Promise<bigint>,
        publicClient.readContract({
          address: dex.usdc.address,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [address as Address],
        }) as Promise<bigint>,
        publicClient.readContract({
          address: dex.weth.address,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [address as Address],
        }) as Promise<bigint>,
      ]);
      setErc20({ w0g, usdc, weth });
    } catch {
      setErc20(null);
    } finally {
      setLoadingErc20(false);
    }
  }, [address, dex, publicClient]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const rows: TokenBalanceRow[] = useMemo(() => {
    const native = nativeBal?.value ?? 0n;
    const w0g = erc20?.w0g ?? 0n;
    const ogTotal = native + w0g;
    const usdc = erc20?.usdc ?? 0n;
    const weth = erc20?.weth ?? 0n;

    const fmt = (v: bigint, decimals: number, digits = 4) => {
      const n = Number(formatUnits(v, decimals));
      if (!Number.isFinite(n)) return "0";
      if (n === 0) return "0";
      if (n < 0.0001) return "<0.0001";
      return n.toLocaleString(undefined, { maximumFractionDigits: digits });
    };

    return [
      {
        id: "og",
        symbol: "OG",
        label: "OG / W0G",
        balance: fmt(ogTotal, 18),
        raw: ogTotal,
        decimals: 18,
        spendable: true,
        note:
          w0g > 0n
            ? `${fmt(native, 18)} native + ${fmt(w0g, 18)} wrapped`
            : "Native + wrapped",
      },
      {
        id: "usdc",
        symbol: "USDC",
        label: "USDC",
        balance: dex ? fmt(usdc, dex.usdc.decimals, 2) : "—",
        raw: usdc,
        decimals: dex?.usdc.decimals ?? 6,
        spendable: !!dex,
        note: dex ? "Spend to buy OG" : "Token map unavailable on this chain",
      },
      {
        id: "weth",
        symbol: "WETH",
        label: "WETH",
        balance: dex ? fmt(weth, dex.weth.decimals) : "—",
        raw: weth,
        decimals: dex?.weth.decimals ?? 18,
        spendable: false,
        note: "Holdings only — no live desk route yet",
      },
    ];
  }, [dex, erc20, nativeBal?.value]);

  const usdcBalance = erc20?.usdc ?? 0n;
  const ogSpendable = (nativeBal?.value ?? 0n) + (erc20?.w0g ?? 0n);

  return {
    isConnected,
    loading: nativeLoading || loadingErc20,
    rows,
    dex,
    usdcBalance,
    ogSpendable,
    usdcDecimals: dex?.usdc.decimals ?? 6,
    refresh,
  };
}
