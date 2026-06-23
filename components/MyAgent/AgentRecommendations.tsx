"use client";

import { motion } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { useUserFiles } from "@/hooks/useUserFiles";
import { useAccount } from "wagmi";
import { fetchFileContent } from "@/utils/fetchFileContent";
import {
  AGENT_DOMAINS,
  DOMAIN_META,
  matchFileToDomain,
  type AgentDomain,
} from "@/lib/domains";
import { toast } from "sonner";

interface RecommendationData {
  title: string;
  description: string;
  summary: string;
  recommendations: string[];
}

export default function AgentRecommendations() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const domainParam = searchParams.get("domain");
  const domain = AGENT_DOMAINS.includes(domainParam as AgentDomain)
    ? (domainParam as AgentDomain)
    : null;

  const { files, refetch } = useUserFiles();
  const { isConnected } = useAccount();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RecommendationData | null>(null);

  const loadRecommendations = useCallback(async () => {
    if (!domain || !isConnected) return;
    setLoading(true);
    try {
      const syncedFiles = await refetch();

      const vaultContext = await Promise.all(
        syncedFiles.map(async (f) => {
          let summary = "";
          if (f.insightsCID && f.insightsCID !== "0x" + "0".repeat(64)) {
            try {
              summary = await fetchFileContent(f.insightsCID);
            } catch {
              summary = f.category;
            }
          }
          return { category: f.category, summary, domain: matchFileToDomain(f.category) };
        })
      );

      const relevant = vaultContext.filter((f) => f.domain === domain || !f.domain);

      const res = await fetch("/api/agentRecommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain,
          vaultContext: relevant.length ? relevant : vaultContext,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load recommendations");

      setData(json);
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message);
      setData({
        ...DOMAIN_META[domain],
        summary: DOMAIN_META[domain].description,
        recommendations: [
          "Upload documents to your vault and run AI insights first.",
          "Sync your vault from the Learning page.",
          "Ensure GALILEO_PRIVATE_KEY is set for 0G Compute.",
        ],
      });
    } finally {
      setLoading(false);
    }
  }, [domain, isConnected, refetch]);

  useEffect(() => {
    if (domain && isConnected) loadRecommendations();
  }, [domain, isConnected, loadRecommendations]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-5xl mx-auto"
    >
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold tracking-tight flex justify-center items-center gap-2">
          {data ? (
            <>
              <Sparkles className="w-6 h-6 text-primary" />
              {data.title} Recommendations
            </>
          ) : domain ? (
            "Loading recommendations..."
          ) : (
            "Agentic ID Recommendations"
          )}
        </h1>
        <p className="text-foreground/70 max-w-2xl mx-auto">
          {data?.summary ||
            (domain
              ? "Powered by 0G Compute from your vault data"
              : "Select a domain from Learning to view specialized insights.")}
        </p>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {!loading && data && (
        <motion.div
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
          }}
        >
          {data.recommendations.map((rec, i) => (
            <motion.div
              key={i}
              variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
            >
              <Card className="hover:shadow-xl transition-all border border-muted/40">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" /> Insight #{i + 1}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground/80 leading-relaxed">{rec}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {!loading && !domain && (
        <Card className="text-center py-10">
          <CardContent className="text-foreground/60">
            No domain selected. Return to Learning to view personalized recommendations.
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center gap-3 pt-8">
        {domain && (
          <Button variant="secondary" onClick={loadRecommendations} disabled={loading}>
            Refresh
          </Button>
        )}
        <Button
          variant="outline"
          size="lg"
          onClick={() => router.push("/dashboard/agent/learning")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Learning
        </Button>
      </div>
    </motion.div>
  );
}
