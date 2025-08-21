import { ZgFile, Indexer } from "@0glabs/0g-ts-sdk";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import os from "os";

const RPC_URL = process.env.GALILEO_RPC_URL!;
const INDEXER_RPC = process.env.INDEXER_RPC_URL!;
const PRIVATE_KEY = process.env.GALILEO_PRIVATE_KEY!;

const provider = new ethers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);
const indexer = new Indexer(INDEXER_RPC);

export interface UploadResult {
  fileName: string;
  rootHash: string;
}

export async function uploadFileTo0G(file: File): Promise<UploadResult> {
  const tempFilePath = path.join(os.tmpdir(), file.name);
  const arrayBuffer = await file.arrayBuffer();
  await fs.promises.writeFile(tempFilePath, Buffer.from(arrayBuffer));

  const zgFile = await ZgFile.fromFilePath(tempFilePath);

  try {
    const [tree, treeErr] = await zgFile.merkleTree();
    if (treeErr)
      throw new Error(`Merkle tree error for ${file.name}: ${treeErr}`);
    if (!tree) throw new Error(`Merkle tree is null for ${file.name}`);

    // Deterministic root hash from file content
    const rootHash = tree.rootHash();
    if (!rootHash) throw new Error(`Root hash is null for ${file.name}`);

    // Try uploading
    const [uploadedData, uploadErr] = await indexer.upload(zgFile, RPC_URL, signer);

    // --- Handle "Data already exists" gracefully ---
    if (uploadErr) {
      let errMsg = "Unknown upload error";

      if (typeof uploadErr === "string") {
        errMsg = uploadErr;
      } else if (typeof uploadErr === "object" && uploadErr !== null) {
        errMsg = JSON.stringify(uploadErr);
        if ("message" in uploadErr) errMsg = (uploadErr as any).message;
      }

      if (errMsg.includes("Data already exists")) {
        console.warn(`File already exists, skipping upload: ${file.name}`);
        return { fileName: file.name, rootHash }; // use deterministic root hash
      } else {
        throw new Error(`Upload failed for ${file.name}: ${errMsg}`);
      }
    }

    // --- Successful upload ---
    // Use returned dataMerkleRoot if available, else deterministic root
    const finalRootHash =
      uploadedData && typeof uploadedData === "object" && "dataMerkleRoot" in uploadedData
        ? (uploadedData as any).dataMerkleRoot
        : rootHash;

    return { fileName: file.name, rootHash: finalRootHash };
  } finally {
    await zgFile.close();
    await fs.promises.unlink(tempFilePath);
  }
}
