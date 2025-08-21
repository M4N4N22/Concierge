const INDEXER_GATEWAY = process.env.NEXT_PUBLIC_INDEXER_GATEWAY!;
// e.g., https://indexer-storage-testnet-turbo.0g.ai

export async function fetchFileContent(
  rootHash: string,
  retries = 2
): Promise<string> {
  if (!rootHash) throw new Error("Missing rootHash");

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Attempt ${attempt}: Fetching file for rootHash: ${rootHash}`);
      const res = await fetch(`${INDEXER_GATEWAY}/file?root=${rootHash}`);
      console.log("Response status:", res.status);

      if (res.status === 600) {
        const bodyText = await res.text();
        console.error("Failed response body:", bodyText);
        throw new Error("File temporarily unavailable: segment missing");
      }

      if (!res.ok) {
        const bodyText = await res.text();
        console.error("Failed response body:", bodyText);
        throw new Error(`Failed to fetch file: ${res.status}`);
      }

      const text = await res.text();
      console.log("fetched text:", text); 
      return text; 
    } catch (err: any) {
      console.error("Error fetching file:", err);
      if (attempt === retries) throw err; // rethrow on last attempt
      console.log("Retrying...");
    }
  }

  throw new Error("Failed to fetch file content after retries");
}
