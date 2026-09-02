const NAME_PREFIX = "concierge:agent-display-name";
const BIO_PREFIX = "concierge:agent-bio";

function nameKey(chainId: number, tokenId: bigint): string {
  return `${NAME_PREFIX}:${chainId}:${tokenId.toString()}`;
}

function bioKey(chainId: number, tokenId: bigint): string {
  return `${BIO_PREFIX}:${chainId}:${tokenId.toString()}`;
}

export function getAgentDisplayName(
  chainId: number,
  tokenId: bigint
): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(nameKey(chainId, tokenId));
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
      localStorage.removeItem(nameKey(chainId, tokenId));
    } else {
      localStorage.setItem(nameKey(chainId, tokenId), trimmed.slice(0, 64));
    }
  } catch {
    /* ignore quota / private mode */
  }
}

export function getAgentBio(chainId: number, tokenId: bigint): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(bioKey(chainId, tokenId));
    return value?.trim() || null;
  } catch {
    return null;
  }
}

export function setAgentBio(
  chainId: number,
  tokenId: bigint,
  bio: string
): void {
  if (typeof window === "undefined") return;
  const trimmed = bio.trim();
  try {
    if (!trimmed) {
      localStorage.removeItem(bioKey(chainId, tokenId));
    } else {
      localStorage.setItem(bioKey(chainId, tokenId), trimmed.slice(0, 240));
    }
  } catch {
    /* ignore */
  }
}

export function getAgentIdentity(chainId: number, tokenId: bigint): {
  displayName: string | null;
  bio: string | null;
} {
  return {
    displayName: getAgentDisplayName(chainId, tokenId),
    bio: getAgentBio(chainId, tokenId),
  };
}
