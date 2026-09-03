"use client";

import { useCallback, useState } from "react";
import {
  useAccount,
  usePublicClient,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { parseUnits } from "viem";
import {
  ERC20_ABI,
  SWAP_ROUTER02_ABI,
  WETH9_ABI,
  getDexConfig,
  pathForPair,
} from "@/lib/trade/dex";
import { quoteTradeProposal } from "@/lib/trade/quote";
import { isLiveRoutablePair, normalizeTradePair } from "@/lib/trade/pairs";
import type {
  TradeExecutionResult,
  TradeProposal,
  TradeQuote,
} from "@/lib/trade";
import { zeroGFeeOverrides } from "@/lib/zeroGGas";

export function useTradeExecution() {
  const { address, chainId, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const [quoting, setQuoting] = useState(false);
  const [executing, setExecuting] = useState(false);

  const fetchQuote = useCallback(
    async (proposal: TradeProposal, preferChainId?: number): Promise<TradeQuote> => {
      setQuoting(true);
      try {
        const cid = preferChainId ?? chainId ?? 16602;
        return await quoteTradeProposal(publicClient ?? null, cid, proposal);
      } finally {
        setQuoting(false);
      }
    },
    [chainId, publicClient]
  );

  const executeQuote = useCallback(
    async (
      proposal: TradeProposal,
      quote: TradeQuote
    ): Promise<TradeExecutionResult> => {
      if (!isConnected || !address) {
        throw new Error("Connect wallet to execute");
      }
      if (proposal.side === "hold") {
        throw new Error("Cannot execute a hold");
      }

      setExecuting(true);
      const executedAt = new Date().toISOString();

      try {
        if (quote.mode === "simulated") {
          return {
            mode: "simulated",
            amountOut: quote.amountOut,
            executedAt,
          };
        }

        if (!isLiveRoutablePair(proposal.pair) || !isLiveRoutablePair(quote.pair)) {
          throw new Error(
            `Live execution only supports OG/USDC (got ${normalizeTradePair(proposal.pair)})`
          );
        }
        if (
          normalizeTradePair(quote.pair) !== normalizeTradePair(proposal.pair)
        ) {
          throw new Error("Quote pair does not match proposal — re-quote");
        }

        const config = getDexConfig(quote.chainId);
        if (!config || !quote.path || !quote.router) {
          throw new Error("Live DEX config missing");
        }

        if (chainId !== quote.chainId) {
          await switchChainAsync({ chainId: quote.chainId });
        }

        const side = quote.side === "sell" ? "sell" : "buy";
        const { tokenIn, tokenOut } = pathForPair(config, side, proposal.pair);
        const amountIn = BigInt(quote.amountInRaw);
        const amountOutMinimum = parseUnits(
          quote.amountOutMinimum,
          tokenOut.decimals
        );

        let wrapTxHash: `0x${string}` | undefined;
        let approveTxHash: `0x${string}` | undefined;
        const fees = await zeroGFeeOverrides(publicClient, quote.chainId);

        // Sell native OG: wrap into W0G if needed
        if (side === "sell" && publicClient) {
          const wBal = (await publicClient.readContract({
            address: config.wNative.address,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [address],
          })) as bigint;
          if (wBal < amountIn) {
            const need = amountIn - wBal;
            const native = await publicClient.getBalance({ address });
            if (native < need) {
              throw new Error(
                `Insufficient OG/W0G — need ${quote.amountIn} W0G`
              );
            }
            wrapTxHash = await writeContractAsync({
              address: config.wNative.address,
              abi: WETH9_ABI,
              functionName: "deposit",
              value: need,
              chainId: quote.chainId,
              ...fees,
            });
            await publicClient.waitForTransactionReceipt({ hash: wrapTxHash });
          }
        }

        if (publicClient) {
          const allowance = (await publicClient.readContract({
            address: tokenIn.address,
            abi: ERC20_ABI,
            functionName: "allowance",
            args: [address, config.swapRouter02],
          })) as bigint;
          if (allowance < amountIn) {
            approveTxHash = await writeContractAsync({
              address: tokenIn.address,
              abi: ERC20_ABI,
              functionName: "approve",
              args: [config.swapRouter02, amountIn],
              chainId: quote.chainId,
              ...fees,
            });
            await publicClient.waitForTransactionReceipt({ hash: approveTxHash });
          }
        }

        const txHash = await writeContractAsync({
          address: config.swapRouter02,
          abi: SWAP_ROUTER02_ABI,
          functionName: "exactInput",
          args: [
            {
              path: quote.path,
              recipient: address,
              amountIn,
              amountOutMinimum,
            },
          ],
          chainId: quote.chainId,
          ...fees,
        });

        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash: txHash });
        }

        return {
          mode: "live",
          txHash,
          approveTxHash,
          wrapTxHash,
          amountOut: quote.amountOut,
          executedAt,
        };
      } finally {
        setExecuting(false);
      }
    },
    [
      address,
      chainId,
      isConnected,
      publicClient,
      switchChainAsync,
      writeContractAsync,
    ]
  );

  return { fetchQuote, executeQuote, quoting, executing };
}
