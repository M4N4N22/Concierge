"use client";

import { useState } from "react";
import { useUserFiles, VaultFile } from "@/hooks/useUserFiles";
import { useAccount } from "wagmi";
import { fetchFileContent } from "@/utils/fetchFileContent";
import { Sparkles } from "lucide-react";
import DemoVaultWizard from "./VaultComputeDemo";

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
    <div className="space-y-6">
      {loading ? (
        <button
          disabled
          className="px-5 py-2 bg-foreground text-background rounded-full font-semibold opacity-70 cursor-not-allowed"
        >
          Loading...
        </button>
      ) : !fetched ? (
        <button
          onClick={handleGetInsights}
          className="px-5 py-2 bg-foreground text-background hover:bg-foreground/90 rounded-full font-semibold"
        >
          View Your Uploaded Files
        </button>
      ) : null}

      {loading && fetched && <p>Loading your files...</p>}

      {fetched && !loading && files.length === 0 && (
        <p className="text-gray-500">No files found. Upload some first.</p>
      )}

      {fetched && files.length > 0 && (
        <div className="space-y-8">
          {Object.entries(
            files.reduce((acc: Record<string, VaultFile[]>, file) => {
              const cat = file.category || "Uncategorized";
              if (!acc[cat]) acc[cat] = [];
              acc[cat].push(file);
              return acc;
            }, {})
          ).map(([category, groupedFiles]) => (
            <div key={category} className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                📂 {category}
              </h3>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {groupedFiles.map((file, idx) => (
                  <div
                    key={`${file.rootHash}-${idx}`}
                    className="p-6  rounded-xl bg-card shadow-sm hover:shadow-md transition"
                  >
                    <p className="font-mono mb-6 text-muted">
                      {truncateHash(file.rootHash)}
                    </p>

                    <div className="mt-3">
                      {insights[file.rootHash] ? (
                        <div className="text-sm whitespace-pre-wrap">
                          {insights[file.rootHash]}
                        </div>
                      ) : (
                        <button
                          onClick={() => computeInsights(file)}
                          className="px-4 py-2  border  rounded-full hover:bg-card/50 hover:border-primary text-sm flex items-center gap-2 font-medium cursor-pointer"
                          disabled={processing === file.rootHash}
                        >
                          {" "}
                          <Sparkles className="inline text-primary" />{" "}
                          {processing === file.rootHash
                            ? "Thinking..."
                            : "Get Insights"}{" "}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
