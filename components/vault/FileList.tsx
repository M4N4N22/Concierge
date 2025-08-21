"use client";

import { useState, useEffect } from "react";
import { useUserFiles, VaultFile } from "@/hooks/useUserFiles";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { VAULT_ABI } from "@/lib/vaultAbi";
import { VAULT_ADDRESS } from "@/lib/contractClient";
import { fetchFileContent } from "@/utils/fetchFileContent";
import { toUtf8String } from "ethers";

import { Loader2 } from "lucide-react";

function FileRow({ file }: { file: VaultFile }) {
  const [content, setContent] = useState<string | null>(null);
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch main file content
        const text = await fetchFileContent(file.rootHash);
        setContent(text);

        // Fetch AI insights if insightsCID exists
      } catch (err: any) {
        console.error("Error fetching file or insights:", err);
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [file.rootHash, file.insightsCID]);

  const truncateHash = (hash: string) =>
    `${hash.slice(0, 6)}...${hash.slice(-6)}`;

  return (
    <tr className="hover:bg-muted/10 text-left">
      <td className="px-4 py-4 border-b text-lg">{file.category}</td>
      <td className="px-4 py-4 border-b text-lg">
        <span className="text-primary">{truncateHash(file.rootHash)}</span>
      </td>
      <td className="px-4 py-4 border-b text-lg">
        {new Date(Number(file.timestamp) * 1000).toLocaleString()}
      </td>
      <td className="px-4 py-4 border-b text-sm">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="animate-spin h-5 w-5" />
            Fetching content...
          </div>
        ) : error ? (
          <span className="text-red-500">Error: {error}</span>
        ) : (
          content?.slice(0, 200)
        )}
      </td>
      <td className="px-4 py-4 border-b text-sm">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="animate-spin h-5 w-5" />
            Fetching insights...
          </div>
        ) : error ? (
          <span className="text-red-500">Error: {error}</span>
        ) : (
          insights?.slice(0, 200) || "No insights"
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
      console.log("Wallet not connected or address missing");
      return;
    }

    try {
      console.log("Loading files for address:", address);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer);

      const rawFiles = await vault.getFiles(address);
      console.log("Raw getFiles call result:", rawFiles);

      refetch?.();
    } catch (err) {
      console.error("Error fetching your files:", err);
    }
  };

  return (
    <div>
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
            <thead className="font-light">
              <tr>
                <th className="px-4 py-4 text-foreground/90 font-normal border-b">
                  Category
                </th>
                <th className="px-4 py-4 text-foreground/90 font-normal border-b">
                  Root Hash
                </th>
                <th className="px-4 py-4 text-foreground/90 font-normal border-b">
                  Timestamp
                </th>
                <th className="px-4 py-4 text-foreground/90 font-normal border-b">
                  Preview
                </th>
                <th className="px-4 py-4 text-foreground/90 font-normal border-b">
                  AI Insights
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
    </div>
  );
}
