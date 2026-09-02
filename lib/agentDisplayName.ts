const STORAGE_PREFIX = "concierge:agent-display-name";

function storageKey(chainId: number, tokenId: bigint): string {
  return `${STORAGE_PREFIX}:${chainId}:${tokenId.toString()}`;
}

export function getAgentDisplayName(
  chainId: number,
  tokenId: bigint
): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(storageKey(chainId, tokenId));
    return value?.trim() || null;
  } catch {
    return null;
  }
}

export function setAgentDisplayName(
  chainId: number,
  tokenId: bigint,
  name: string
): void {
  if (typeof window === "undefined") return;
  const trimmed = name.trim();
  try {
    if (!trimmed) {
      localStorage.removeItem(storageKey(chainId, tokenId));
    } else {
      localStorage.setItem(storageKey(chainId, tokenId), trimmed.slice(0, 64));
    }
  } catch {
    /* ignore quota / private mode */
  }
}
