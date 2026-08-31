/** Live Uniswap route on 0G is W0G ↔ WETH ↔ USDC only. */

const OG_USDC_ALIASES = new Set([
  "OG/USDC",
  "W0G/USDC",
  "USDC/OG",
  "USDC/W0G",
]);

/** Canonical form used in proposals and quotes. */
export function normalizeTradePair(pair: string): string {
  const p = pair.toUpperCase().replace(/\s+/g, "");
  if (OG_USDC_ALIASES.has(p)) return "OG/USDC";
  return p;
}

/** True when a live Uniswap path exists for this pair. */
export function isLiveRoutablePair(pair: string): boolean {
  return normalizeTradePair(pair) === "OG/USDC";
}
