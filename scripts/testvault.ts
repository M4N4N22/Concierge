import { createPublicClient, http } from "viem";
import { VAULT_ABI } from "../lib/vaultAbi";
import "dotenv/config"; 

const RPC_URL = process.env.NEXT_PUBLIC_GALILEO_RPC_URL!;
const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS! as `0x${string}`;

console.log("RPC URL:", RPC_URL);
console.log("Vault Address:", VAULT_ADDRESS);

// Create the public client with direct RPC URL
const client = createPublicClient({
  chain: {
    id: 16601,
    name: "0G Galileo Testnet",
    nativeCurrency: { name: "OG", symbol: "OG", decimals: 18 },
    rpcUrls: { default: { http: [RPC_URL] }, public: { http: [RPC_URL] } },
  },
  transport: http(RPC_URL),
});

// Helper to decode bytes32 → string
function bytes32ToString(bytes32: string): string {
  return Buffer.from(bytes32.slice(2), "hex").toString("utf8").replace(/\0/g, "");
}

// Main test function
async function test() {
  try {
    const result = await client.readContract({
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: "viewFilesByUser",
      args: ["0x84948e317d312dD1808B49C280F814410E4De779"], // user address
    });

    console.log("Raw result:", result);

    if (Array.isArray(result)) {
      const files = result.map((f: any) => ({
        rootHash: bytes32ToString(f.fileHash),
        category: f.category,
        insightsCID: bytes32ToString(f.insightsCID),
        timestamp: Number(f.timestamp),
      }));

      console.log("Formatted files:", files);
    } else {
      console.log("No files found for this user.");
    }
  } catch (err: any) {
    console.error("Error calling contract:", err);
  }
}

// Run the test
test();
