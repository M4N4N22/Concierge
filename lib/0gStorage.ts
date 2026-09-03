import { ZgFile, Indexer } from "@0gfoundation/0g-storage-ts-sdk";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import os from "os";
import { zeroGStorageGasPrice } from "@/lib/zeroGGas";

const MAINNET_CHAIN_ID = 16661;
const TESTNET_CHAIN_ID = 16602;

/** Resolve storage network from request chain, else OG_CHAIN_ID, else mainnet. */
export function resolveStorageChainId(chainId?: number | null): number {
  if (chainId === MAINNET_CHAIN_ID || chainId === TESTNET_CHAIN_ID) {
    return chainId;
  }
  const fromEnv = Number(process.env.OG_CHAIN_ID);
  if (fromEnv === MAINNET_CHAIN_ID || fromEnv === TESTNET_CHAIN_ID) {
    return fromEnv;
  }
  return MAINNET_CHAIN_ID;
}

function getStorageConfig(chainId: number) {
  const isMainnet = chainId === MAINNET_CHAIN_ID;
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
      `Missing 0G Storage env for chain ${chainId}. Check RPC, indexer, and private key vars.`
    );
  }

  return { rpcUrl, indexerRpc, privateKey, isMainnet };
}

export interface UploadResult {
  fileName: string;
  rootHash: string;
  alreadyExists?: boolean;
  chainId: number;
}

export async function uploadFileTo0G(
  file: File,
  chainId?: number | null
): Promise<UploadResult> {
  const resolvedChainId = resolveStorageChainId(chainId);
  const { rpcUrl, indexerRpc, privateKey, isMainnet } =
    getStorageConfig(resolvedChainId);

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);
  const indexer = new Indexer(indexerRpc);

  const tempFilePath = path.join(os.tmpdir(), file.name);
  const arrayBuffer = await file.arrayBuffer();

  console.log(`\n=== Uploading file: ${file.name} ===`);
  console.log(
    `Storage chainId: ${resolvedChainId} (${isMainnet ? "mainnet" : "testnet"})`
  );
  console.log(`Indexer: ${indexerRpc}`);

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

    const gasPrice = await zeroGStorageGasPrice(signer.provider!, resolvedChainId);
    if (gasPrice) {
      console.log(`Using storage gasPrice: ${gasPrice.toString()} wei`);
    }

    console.log("Starting upload to indexer...");
    const [uploadedData, uploadErr] = await indexer.upload(
      zgFile,
      rpcUrl,
      signer,
      undefined,
      undefined,
      gasPrice ? { gasPrice } : undefined
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
        return {
          fileName: file.name,
          rootHash,
          alreadyExists: true,
          chainId: resolvedChainId,
        };
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

    return {
      fileName: file.name,
      rootHash: finalRootHash,
      chainId: resolvedChainId,
    };
  } finally {
    await zgFile.close();
    await fs.promises.unlink(tempFilePath);
  }
}
