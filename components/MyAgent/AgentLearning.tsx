"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Loader2, RefreshCw, BarChart } from "lucide-react";
import { useUserFiles } from "@/hooks/useUserFiles";
import { useAccount } from "wagmi";
import { fetchFileContent } from "@/utils/fetchFileContent";
import {
  AGENT_DOMAINS,
  DOMAIN_META,
  domainProgress,
  type AgentDomain,
} from "@/lib/domains";

export default function AgentLearning() {
  const [loading, setLoading] = useState(false);
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const { files, refetch, loading: filesLoading } = useUserFiles();
  const { isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (isConnected) refetch();
  }, [isConnected, refetch]);

  const handleSyncVault = useCallback(async () => {
    if (!isConnected) {
      toast.error("Connect your wallet first");
      return;
    }
    setLoading(true);
    try {
      const syncedFiles = await refetch();

      const newSummaries: Record<string, string> = {};
      for (const file of syncedFiles) {
        if (!file.insightsCID || file.insightsCID === "0x" + "0".repeat(64)) continue;
        try {
          const text = await fetchFileContent(file.insightsCID);
          newSummaries[file.rootHash] = text.slice(0, 500);
        } catch {
          newSummaries[file.rootHash] = file.category;
        }
      }

      setSummaries(newSummaries);
      toast.success("Vault synced from on-chain data");
    } catch (err) {
      console.error(err);
      toast.error("Failed to sync vault");
    } finally {
      setLoading(false);
    }
  }, [isConnected, refetch]);

  return (
    <div className="mx-auto p-6 flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Agentic ID learning</h2>
        <p className="text-sm text-muted-foreground">
          Sync vault data to update each domain agent
        </p>
      </div>

      <Button
        onClick={handleSyncVault}
        disabled={loading || filesLoading}
        className="w-fit mx-auto flex items-center justify-center gap-2"
      >
        {loading || filesLoading ? (
          <Loader2 className="animate-spin w-5 h-5" />
        ) : (
          <RefreshCw className="w-5 h-5" />
        )}
        {loading ? "Syncing Vault..." : "Sync Vault & Update Learning"}
      </Button>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {AGENT_DOMAINS.map((domain) => {
          const progress = domainProgress(files, domain);
          const meta = DOMAIN_META[domain];
          const domainFiles = files.filter(
            (f) => f.category.toLowerCase().includes(domain) ||
              summaries[f.rootHash]
          );

          return (
            <Card key={domain}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="w-5 h-5 text-primary" />
                  {meta.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{meta.description}</p>
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  Learning progress: {progress}% · {files.length} vault file(s)
                </p>
                {domainFiles.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Latest: {domainFiles[0].category}
                  </p>
                )}
                <Button
                  className="w-full"
                  onClick={() =>
                    router.push(`/dashboard/agent/recommendations?domain=${domain}`)
                  }
                >
                  View Recommendations
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
