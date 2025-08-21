import { ethers } from "ethers";
import VaultArtifact from "@/artifacts/contracts/Vault/Vault.sol/Vault.json";

const VAULT_ADDRESS = process.env.VAULT_ADDRESS!;
const RPC_URL = process.env.GALILEO_RPC_URL!;
const PRIVATE_KEY = process.env.GALILEO_PRIVATE_KEY!;

const provider = new ethers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);
const vaultContract = new ethers.Contract(VAULT_ADDRESS, VaultArtifact.abi, signer);

/**
 * Converts a 0G root hash (string) to bytes32
 */
export function rootHashToBytes32(rootHash: string): string {
    const bytes = ethers.toUtf8Bytes(rootHash);
    if (bytes.length > 32) throw new Error("String too long for bytes32");
    const padded = new Uint8Array(32);
    padded.set(bytes, 0); // pad with zeros at the end
    return ethers.hexlify(padded);
  }

export async function addFileToVault(
  rootHash: string,
  category: string,
  encryptedKey: string,
  insightsCID: string
) {
  const fileHashBytes32 = rootHashToBytes32(rootHash);
  const insightsBytes32 = rootHashToBytes32(insightsCID);

  const tx = await vaultContract.addFile(
    fileHashBytes32,
    category,
    encryptedKey,
    insightsBytes32
  );
  await tx.wait();
  return tx.hash;
}
