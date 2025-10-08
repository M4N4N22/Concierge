"use client";

import { useState, useEffect } from "react";
import { useUserFiles, VaultFile } from "@/hooks/useUserFiles";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { VAULT_ABI } from "@/lib/vaultAbi";
import { VAULT_ADDRESS } from "@/lib/contractClient";
import { fetchFileContent } from "@/hooks/useFileContent";
import { Loader2 } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

function FileRow({ file }: { file: VaultFile }) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      setError(null);

      try {
        const text = await fetchFileContent(file.rootHash);
        setContent(text);
      } catch (err: any) {
        console.error("Error fetching file content:", err);
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [file.rootHash]);

  const truncateHash = (hash: string) =>
    `${hash.slice(0, 6)}...${hash.slice(-6)}`;

  return (
    <tr className="hover:bg-primary/10 text-left">
      <td className="px-4 py-4 border-b text-sm font-medium">
        {file.category}
      </td>

      <td className="px-4 py-4 border-b text-sm font-medium">
        <span className="text-primary">{truncateHash(file.rootHash)}</span>
      </td>

      <td className="px-4 py-4 border-b text-sm font-medium">
        {new Date(Number(file.timestamp) * 1000).toLocaleString()}
      </td>

      {/* On-Chain status */}
      <td className="px-4 py-4 border-b text-sm">
        {file.rootHash ? (
          <span className="text-green-600 font-medium">Success</span>
        ) : (
          <span className="text-red-500">Not found</span>
        )}
      </td>

      {/* Off-Chain Storage status */}
      <td className="px-4 py-4 border-b text-sm font-medium">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="animate-spin h-5 w-5" />
            Checking...
          </div>
        ) : content?.includes("File not found") ? (
          <span className="text-yellow-600">Not uploaded yet / Indexing</span>
        ) : content ? (
          <span className="text-green-600 font-medium">Available</span>
        ) : error ? (
          <span className="text-red-500">Error: {error}</span>
        ) : (
          <span className="text-yellow-600">Not uploaded yet / Indexing</span>
        )}
      </td>

      {/* Preview */}
      <td className="px-4 py-4 border-b text-sm font-medium">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="animate-spin h-5 w-5" />
            Fetching preview...
          </div>
        ) : content && !content.includes("File not found") ? (
          content.slice(0, 200)
        ) : (
          <span className="text-foreground/70 italic">
            No preview available
          </span>
        )}
      </td>
    </tr>
  );
}

export default function FileList() {
  const { files, loading, refetch } = useUserFiles();
  const { isConnected, address } = useAccount();
  const loadUserFiles = async () => {
    if (!isConnected || !address) {
      console.warn("Wallet not connected or address missing:", { isConnected, address });
      return;
    }
  
    try {
      console.log("=== Loading user files ===");
      console.log("User address:", address);
  
      // Provider
      const provider = new ethers.JsonRpcProvider("https://evmrpc-testnet.0g.ai");
      console.log("Provider initialized:", provider);
  
      // Check chain ID
      const network = await provider.getNetwork();
      console.log("Connected network:", network);
  
      // Contract
      const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);
      console.log("Vault contract instance created:", vault.address);
  
      // Optional: check if code exists
      const code = await provider.getCode(VAULT_ADDRESS);
      console.log("Vault contract code length:", code.length, code.length > 2 ? "✅ exists" : "❌ missing");
  
      // Call getFiles
      console.log("Calling getFiles...");
      const rawFiles = await vault.viewFilesByUser(address);
      console.log("✅ getFiles call result:", rawFiles);
  
      // Refetch UI
      refetch?.();
      console.log("Refetch triggered");
  
    } catch (err: any) {
      console.error("❌ Error fetching user files:");
      console.error("Error message:", err.message);
      console.error("Error code:", err.code);
      console.error("Error data:", err.data);
      console.error("Full error object:", err);
    }
  };
  

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="files">
        <AccordionTrigger className="text-lg font-semibold">
          Your Uploaded Files
        </AccordionTrigger>
        <AccordionContent>
          {!files.length && (
            <button
              onClick={loadUserFiles}
              className="px-4 py-1 bg-foreground text-background hover:bg-foreground/90 rounded-full mb-3 font-semibold"
            >
              View Your Uploaded Files
            </button>
          )}

          {loading && (
            <div className="flex items-center gap-2 text-muted mb-3">
              <Loader2 className="animate-spin h-5 w-5" />
              Loading files...
            </div>
          )}

          {files.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full rounded text-left">
                <thead className="font-light text-xs uppercase">
                  <tr>
                    <th className="px-4 py-4 text-foreground/90 font-normal border-b">
                      AI Assigned Category
                    </th>
                    <th className="px-4 py-4 text-foreground/90 font-normal border-b">
                      Root Hash
                    </th>
                    <th className="px-4 py-4 text-foreground/90 font-normal border-b">
                      Timestamp
                    </th>
                    <th className="px-4 py-4 text-foreground/90 font-normal border-b">
                      On-Chain
                    </th>
                    <th className="px-4 py-4 text-foreground/90 font-normal border-b">
                      Off-Chain (0G Storage)
                    </th>
                    <th className="px-4 py-4 text-foreground/90 font-normal border-b">
                      Preview
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file, index) => (
                    <FileRow key={index} file={file} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
