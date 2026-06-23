import { ethers } from "ethers";
import VaultArtifact from "@/artifacts/contracts/Vault/Vault.sol/Vault.json";

function getVaultContract() {
  const vaultAddress = process.env.VAULT_ADDRESS;
  const rpcUrl = process.env.GALILEO_RPC_URL;
  const privateKey = process.env.GALILEO_PRIVATE_KEY;

  if (!vaultAddress || !rpcUrl || !privateKey) {
    throw new Error("Missing Vault contract env vars (VAULT_ADDRESS, GALILEO_RPC_URL, GALILEO_PRIVATE_KEY)");
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);
  return new ethers.Contract(vaultAddress, VaultArtifact.abi, signer);
}

/**
 * Converts a 0G root hash (string) to bytes32
 */
export function rootHashToBytes32(rootHash: string): string {
  const bytes = ethers.toUtf8Bytes(rootHash);
  if (bytes.length > 32) throw new Error("String too long for bytes32");
  const padded = new Uint8Array(32);
  padded.set(bytes, 0);
  return ethers.hexlify(padded);
}

export async function addFileToVault(
  rootHash: string,
  category: string,
  encryptedKey: string,
  insightsCID: string
) {
  const vaultContract = getVaultContract();
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
