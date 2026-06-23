import { zeroGMainnet, zeroGTestnet } from "@/lib/wagmi/config";

export function getChainExplorerBaseUrl(chainId: number): string {
  if (chainId === zeroGMainnet.id) {
    return zeroGMainnet.blockExplorers.default.url;
  }
  return zeroGTestnet.blockExplorers.default.url;
}

export function getTxExplorerUrl(chainId: number, txHash: string): string {
  return `${getChainExplorerBaseUrl(chainId)}/tx/${txHash}`;
}

/** 0G StorageScan — browse network storage activity (does not download files). */
export function getStorageScanUrl(chainId: number): string {
  return chainId === zeroGMainnet.id
    ? "https://storagescan.0g.ai"
    : "https://storagescan-galileo.0g.ai";
}

/**
 * Raw indexer API URL — returns file bytes and triggers a browser download.
 * Use only for programmatic fetch (e.g. preview), not as a "view" link in the UI.
 */
export function getStorageIndexerFileUrl(chainId: number, rootHash: string): string {
  const gateway =
    chainId === zeroGMainnet.id
      ? process.env.NEXT_PUBLIC_INDEXER_MAINNET_GATEWAY ||
        "https://indexer-storage-turbo.0g.ai"
      : process.env.NEXT_PUBLIC_INDEXER_TESTNET_GATEWAY ||
        "https://indexer-storage-testnet-turbo.0g.ai";
  return `${gateway}/file?root=${rootHash}`;
}

/** @deprecated Use getStorageIndexerFileUrl — name kept for internal fetch callers */
export const getStorageFileUrl = getStorageIndexerFileUrl;

export function truncateHash(hash: string, start = 8, end = 6): string {
  if (hash.length <= start + end + 1) return hash;
  return `${hash.slice(0, start)}…${hash.slice(-end)}`;
}
