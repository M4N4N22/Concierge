const INDEXER_GATEWAY = process.env.NEXT_PUBLIC_INDEXER_GATEWAY!;
// e.g., https://indexer-storage-testnet-turbo.0g.ai

export async function fetchFileContent(
  rootHash: string,
  retries = 2
): Promise<string> {
  if (!rootHash) throw new Error("Missing rootHash");

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`\n=== Attempt ${attempt} ===`);
      console.log(`Fetching file for rootHash: ${rootHash}`);
      console.log(`URL: ${INDEXER_GATEWAY}/file?root=${rootHash}`);

      const res = await fetch(`${INDEXER_GATEWAY}/file?root=${rootHash}`);
      console.log("Response status:", res.status);
      console.log("Response headers:", Array.from(res.headers.entries()));

      const bodyText = await res.text();
      console.log("Response body preview:", bodyText.slice(0, 500)); // first 500 chars

      if (res.status === 600) {
        console.error("File temporarily unavailable: segment missing");
        throw new Error("File temporarily unavailable: segment missing");
      }

      if (!res.ok) {
        console.error(`Failed to fetch file. Status: ${res.status}`);
        throw new Error(`Failed to fetch file: ${res.status}`);
      }

      console.log("File fetched successfully.");
      return bodyText; // return successfully fetched content
    } catch (err: any) {
      console.error("Error fetching file:", err);
      if (attempt === retries) {
        console.error("All retries failed.");
        throw err; // rethrow on last attempt
      }
      console.log("Retrying...\n");
    }
  }

  throw new Error("Failed to fetch file content after retries");
}
