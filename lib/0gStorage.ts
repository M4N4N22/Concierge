import { ZgFile, Indexer } from "@0gfoundation/0g-storage-ts-sdk";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import os from "os";

const CHAIN_ID = Number(process.env.OG_CHAIN_ID ?? 16602);

const isMainnet = CHAIN_ID === 16661;

function getStorageConfig() {
  const rpcUrl = isMainnet
    ? process.env.OG_MAINNET_RPC_URL
    : process.env.GALILEO_RPC_URL;
  const indexerRpc = isMainnet
    ? process.env.OG_MAINNET_INDEXER_RPC_URL
    : process.env.INDEXER_RPC_URL;
  const privateKey = isMainnet
    ? process.env.OG_MAINNET_PRIVATE_KEY
    : process.env.GALILEO_PRIVATE_KEY;

  if (!rpcUrl || !indexerRpc || !privateKey) {
    throw new Error(
      `Missing 0G Storage env for chain ${CHAIN_ID}. Check RPC, indexer, and private key vars.`
    );
  }

  return { rpcUrl, indexerRpc, privateKey };
}

function getSigner() {
  const { rpcUrl, privateKey } = getStorageConfig();
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  return new ethers.Wallet(privateKey, provider);
}

function getIndexer() {
  const { indexerRpc } = getStorageConfig();
  return new Indexer(indexerRpc);
}

export interface UploadResult {
  fileName: string;
  rootHash: string;
  alreadyExists?: boolean;
}

export async function uploadFileTo0G(file: File): Promise<UploadResult> {
  const { rpcUrl } = getStorageConfig();
  const signer = getSigner();
  const indexer = getIndexer();

  const tempFilePath = path.join(os.tmpdir(), file.name);
  const arrayBuffer = await file.arrayBuffer();

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

    const rootHash = tree.rootHash();
    if (!rootHash) throw new Error(`Root hash is null for ${file.name}`);

    console.log(`Local Merkle root (deterministic): ${rootHash}`);

    console.log("Starting upload to indexer...");
    const [uploadedData, uploadErr] = await indexer.upload(
      zgFile,
      rpcUrl,
      signer
    );

    if (uploadErr) {
      let errMsg = "Unknown upload error";

      if (typeof uploadErr === "string") {
        errMsg = uploadErr;
      } else if (typeof uploadErr === "object" && uploadErr !== null) {
        errMsg = JSON.stringify(uploadErr);
        if ("message" in uploadErr) errMsg = (uploadErr as Error).message;
      }

      console.error(`Upload error: ${errMsg}`);

      if (errMsg.includes("Data already exists")) {
        console.warn(`File already exists, skipping upload: ${file.name}`);
        return { fileName: file.name, rootHash, alreadyExists: true };
      }

      throw new Error(`Upload failed for ${file.name}: ${errMsg}`);
    }

    console.log("Upload successful. Indexer response:", uploadedData);

    let indexerRoot: string | null = null;
    if (
      uploadedData &&
      typeof uploadedData === "object" &&
      "dataMerkleRoot" in uploadedData
    ) {
      indexerRoot = (uploadedData as { dataMerkleRoot: string }).dataMerkleRoot;
      console.log(`Indexer returned rootHash: ${indexerRoot}`);
    } else {
      console.warn(
        "Indexer did not return dataMerkleRoot, falling back to local root."
      );
    }

    const finalRootHash = indexerRoot ?? rootHash;

    if (indexerRoot && indexerRoot !== rootHash) {
      console.warn(
        `Root hash mismatch — local: ${rootHash}, indexer: ${indexerRoot}`
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
