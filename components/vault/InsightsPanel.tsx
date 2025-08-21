"use client";

import { useState } from "react";
import { useUserFiles, VaultFile } from "@/hooks/useUserFiles";
import { useAccount } from "wagmi";
import { fetchFileContent } from "@/utils/fetchFileContent"; 
import { Sparkles } from 'lucide-react';

export default function AIInsights() {
  const { files, loading, refetch } = useUserFiles();
  const { isConnected, address } = useAccount();
  const [insights, setInsights] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false); 

  const computeInsights = async (file: VaultFile) => {
    try {
      setProcessing(file.rootHash);

      // Fetch file content using the plain async function
      const fileContent = await fetchFileContent(file.rootHash);

      // Send content to backend for AI insights
      const res = await fetch("/api/computeInsights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rootHash: file.rootHash,
          fileName: `file-${file.rootHash.slice(0, 6)}.json`,
          content: fileContent,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setInsights((prev) => ({
          ...prev,
          [file.rootHash]: data.summary || "No summary returned", // show summary
        }));
        file.category = data.category; // update the category locally for display
        refetch?.();
      } else {
        setInsights((prev) => ({
          ...prev,
          [file.rootHash]: `Error: ${data.error}`,
        }));
      }
    } catch (err) {
      console.error("Error computing insights:", err);
      setInsights((prev) => ({
        ...prev,
        [file.rootHash]: "Unexpected error fetching file or computing insights",
      }));
    } finally {
      setProcessing(null);
    }
  };

  const truncateHash = (hash: string) =>
    `${hash.slice(0, 6)}...${hash.slice(-6)}`;

  const handleGetInsights = async () => {
    if (!isConnected || !address) {
      alert("Please connect your wallet first.");
      return;
    }
    await refetch?.();
    setFetched(true);
  };

  return (
    <div className="space-y-4">
      {!fetched && (
        <button
          onClick={handleGetInsights}
          className="px-5 py-2 bg-foreground text-background hover:bg-foreground/90 rounded-full font-semibold"
        >
          Get Insights from Your Uploaded Files
        </button>
      )}

      {loading && fetched && <p>Loading your files...</p>}

      {fetched && !loading && files.length === 0 && (
        <p className="text-gray-500">No files found. Upload some first.</p>
      )}

      {fetched && files.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left rounded">
            <thead>
              <tr>
                <th className="px-4 py-3 border-b">Category</th>
                <th className="px-4 py-3 border-b">File Hash</th>
                <th className="px-4 py-3 border-b">Insights</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file: VaultFile, idx: number) => (
                <tr key={idx} className="">
                  <td className="px-4 py-3 border-b">{file.category || "—"}</td>
                  <td className="px-4 py-3 border-b">
                    <span className="font-mono text-sm">
                      {truncateHash(file.rootHash)}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-b">
                    {insights[file.rootHash] ? (
                      <pre className="whitespace-pre-wrap text-sm max-w-xl">
                        {insights[file.rootHash]}
                      </pre>
                    ) : (
                      <button
                        onClick={() => computeInsights(file)}
                        className="px-4 py-2 bg-card border border-transparent rounded-full hover:bg-card/50 hover:border-primary text-sm flex items-center gap-2 font-medium cursor-pointer"
                        disabled={processing === file.rootHash}
                      >
                        <Sparkles className="inline text-primary" />
                        {processing === file.rootHash
                          ? "Thinking..."
                          : "Get Insights"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
