const INDEXER_GATEWAY = process.env.NEXT_PUBLIC_INDEXER_GATEWAY!;
// e.g., https://indexer-storage-testnet-turbo.0g.ai

export async function fetchFileContent(
  rootHash: string,
  retries = 2
): Promise<string> {
  if (!rootHash) throw new Error("Missing rootHash");

  console.log("=== Fetch File Debug Logs ===");
  console.log("Env INDEXER_GATEWAY:", INDEXER_GATEWAY || "❌ MISSING");

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`\n=== Attempt ${attempt} of ${retries} ===`);
      const url = `${INDEXER_GATEWAY}/file?root=${rootHash}`;
      console.log("RootHash:", rootHash);
      console.log("Request URL:", url);

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Accept": "*/*",
        },
      });

      console.log("Response status:", res.status);
      console.log("Response statusText:", res.statusText);
      console.log("Response headers:", Object.fromEntries(res.headers.entries()));

      // Try both text + json to detect actual format
      const rawText = await res.text();
      console.log("Raw response length:", rawText.length);
      console.log("Raw response preview:", rawText.slice(0, 300));

      let parsed: any = null;
      try {
        parsed = JSON.parse(rawText);
        console.log("JSON parsed successfully. Keys:", Object.keys(parsed || {}));
      } catch (jsonErr) {
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
}
