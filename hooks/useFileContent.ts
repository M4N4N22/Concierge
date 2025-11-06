"use client";

import { useAccount } from "wagmi";
import { useCallback } from "react";

const MAINNET_CHAIN_ID = 16661;

const INDEXER_GATEWAYS = {
  mainnet:
    process.env.NEXT_PUBLIC_INDEXER_MAINNET_GATEWAY ||
    "https://indexer-storage-turbo.0g.ai",
  testnet:
    process.env.NEXT_PUBLIC_INDEXER_TESTNET_GATEWAY ||
    "https://indexer-storage-testnet-turbo.0g.ai",
} as const;

/**
 * Client-side hook to auto-detect the correct 0G Indexer Gateway
 * based on the connected wallet's chain (mainnet/testnet).
 */
export function usefetchFileContent() {
  const { chainId } = useAccount();

  const getGateway = useCallback(() => {
    if (chainId === MAINNET_CHAIN_ID) return INDEXER_GATEWAYS.mainnet;
    if (chainId && chainId !== MAINNET_CHAIN_ID) return INDEXER_GATEWAYS.testnet;
    return INDEXER_GATEWAYS.mainnet; // fallback default
  }, [chainId]);

  const fetchFileContent = useCallback(
    async (rootHash: string, retries = 2): Promise<string> => {
      if (!rootHash) throw new Error("Missing rootHash");

      const INDEXER_GATEWAY = getGateway();

      console.log("=== Fetch File Debug Logs ===");
      console.log("Detected chainId:", chainId ?? "unknown");
      console.log("Selected Gateway:", INDEXER_GATEWAY);

      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          console.log(`\n=== Attempt ${attempt} of ${retries} ===`);
          const url = `${INDEXER_GATEWAY}/file?root=${rootHash}`;
          console.log("RootHash:", rootHash);
          console.log("Request URL:", url);

          const res = await fetch(url, {
            method: "GET",
            headers: {
              Accept: "*/*",
            },
          });

          console.log("Response status:", res.status);
          console.log("Response statusText:", res.statusText);
          console.log(
            "Response headers:",
            Object.fromEntries(res.headers.entries())
          );

          const rawText = await res.text();
          console.log("Raw response length:", rawText.length);
          console.log("Raw response preview:", rawText.slice(0, 300));

          let parsed: any = null;
          try {
            parsed = JSON.parse(rawText);
            console.log("JSON parsed successfully. Keys:", Object.keys(parsed || {}));
          } catch {
            console.log("Response is not valid JSON.");
          }

          if (res.status === 600) {
            console.error("File temporarily unavailable: segment missing");
            throw new Error("File temporarily unavailable: segment missing");
          }

          if (!res.ok) {
            console.error(`Failed to fetch file. Status: ${res.status}`);
            throw new Error(`Failed to fetch file: ${res.status}`);
          }

          if (!rawText || rawText === "null") {
            console.warn("⚠️ Response body is empty or 'null'");
          }

          console.log("✅ File fetched successfully.");
          return rawText;
        } catch (err: any) {
          console.error("❌ Error fetching file:", err.message || err);
          if (attempt === retries) {
            console.error("All retries failed.");
            throw err;
          }
          console.log("Retrying...\n");
        }
      }

      throw new Error("Failed to fetch file content after retries");
    },
    [chainId, getGateway]
  );

  return { fetchFileContent };
}
