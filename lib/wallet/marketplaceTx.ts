import type { Address, Hash, PublicClient } from "viem";
import { INFT_AGENT_ABI } from "@/lib/INFTAgentAbi";

export function isNonceTooLowError(err: unknown): boolean {
  const text =
    err instanceof Error
      ? `${err.message} ${err.cause instanceof Error ? err.cause.message : ""}`
      : String(err);
  return /nonce too low|replacement transaction underpriced|already known/i.test(
    text.toLowerCase()
  );
}

export async function getPendingNonce(
  publicClient: PublicClient,
  address: Address
): Promise<number> {
  return publicClient.getTransactionCount({
    address,
    blockTag: "pending",
  });
}

/** Wait until RPC pending nonce advances (post-tx wallet sync on some chains). */
export async function waitForNonceAdvance(
  publicClient: PublicClient,
  address: Address,
  previousNonce: number,
  attempts = 12,
  delayMs = 400
): Promise<number> {
  for (let i = 0; i < attempts; i++) {
    const next = await getPendingNonce(publicClient, address);
    if (next > previousNonce) return next;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return getPendingNonce(publicClient, address);
}

export async function isMarketplaceApproved(args: {
  publicClient: PublicClient;
  agent: Address;
  market: Address;
  tokenId: bigint;
  owner: Address;
}): Promise<boolean> {
  const [approved, approvedForAll] = await Promise.all([
    args.publicClient.readContract({
      address: args.agent,
      abi: INFT_AGENT_ABI,
      functionName: "getApproved",
      args: [args.tokenId],
    }) as Promise<Address>,
    args.publicClient.readContract({
      address: args.agent,
      abi: INFT_AGENT_ABI,
      functionName: "isApprovedForAll",
      args: [args.owner, args.market],
    }) as Promise<boolean>,
  ]);

  return (
    approved.toLowerCase() === args.market.toLowerCase() || approvedForAll === true
  );
}

export async function waitForReceipt(
  publicClient: PublicClient,
  hash: Hash
): Promise<void> {
  await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });
}
