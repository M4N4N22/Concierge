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
  alreadyExists?: boolean;
}

export async function uploadFileTo0G(file: File): Promise<UploadResult> {
  const tempFilePath = path.join(os.tmpdir(), file.name);
  const arrayBuffer = await file.arrayBuffer();

  //  Log file content (assuming it's UTF-8 text)
  const fileContent = Buffer.from(arrayBuffer).toString("utf-8");
  console.log(`\n=== Uploading file: ${file.name} ===`);
  console.log(`File content:\n${fileContent}\n`);

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

    console.log(`Local Merkle root (deterministic): ${rootHash}`);

    // Try uploading
    console.log("Starting upload to indexer...");
    const [uploadedData, uploadErr] = await indexer.upload(
      zgFile,
      RPC_URL,
      signer
    );

    // --- Handle "Data already exists" gracefully ---
    if (uploadErr) {
      let errMsg = "Unknown upload error";

      if (typeof uploadErr === "string") {
        errMsg = uploadErr;
      } else if (typeof uploadErr === "object" && uploadErr !== null) {
        errMsg = JSON.stringify(uploadErr);
        if ("message" in uploadErr) errMsg = (uploadErr as any).message;
      }

      console.error(`Upload error: ${errMsg}`);

      if (errMsg.includes("Data already exists")) {
        console.warn(`File already exists, skipping upload: ${file.name}`);
        return { fileName: file.name, rootHash, alreadyExists: true };
      } else {
        throw new Error(`Upload failed for ${file.name}: ${errMsg}`);
      }
    }

    console.log("Upload successful. Indexer response:", uploadedData);

    // --- Check indexer root hash ---
    let indexerRoot: string | null = null;
    if (
      uploadedData &&
      typeof uploadedData === "object" &&
      "dataMerkleRoot" in uploadedData
    ) {
      indexerRoot = (uploadedData as any).dataMerkleRoot;
      console.log(`Indexer returned rootHash: ${indexerRoot}`);
    } else {
      console.warn(
        "Indexer did not return dataMerkleRoot, falling back to local root."
      );
    }

    // --- Compare and decide ---
    const finalRootHash = indexerRoot ?? rootHash;

    if (indexerRoot && indexerRoot !== rootHash) {
      console.warn(
        `⚠️ Root hash mismatch!\n` +
          `  Local Merkle root:   ${rootHash}\n` +
          `  Indexer root:        ${indexerRoot}\n` +
          `  Final root used:     ${finalRootHash}`
      );
    } else {
      console.log(`Final rootHash used: ${finalRootHash}`);
    }

    return { fileName: file.name, rootHash: finalRootHash };
  } finally {
    await zgFile.close();
    await fs.promises.unlink(tempFilePath);
  }
}
