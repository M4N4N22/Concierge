"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Loader2,
  Cpu,
  RefreshCw,
  CheckCircle2,
  Copy,
  BarChart,
} from "lucide-react";

const mockSyncVault = async () => {
  await new Promise((res) => setTimeout(res, 1500));
  return {
    finance: Math.floor(Math.random() * 100),
    travel: Math.floor(Math.random() * 100),
    subscription: Math.floor(Math.random() * 100),
  };
};

const mockGenerateDomainInsights = async (domain: string) => {
  await new Promise((res) => setTimeout(res, 1000));
  return `Latest insights for ${domain} agent based on your vault data.`;
};

export default function AgentLearning() {
  const [loading, setLoading] = useState(false);
  const [learningProgress, setLearningProgress] = useState({
    finance: 0,
    travel: 0,
    subscription: 0,
  });
  const [insights, setInsights] = useState({
    finance: "",
    travel: "",
    subscription: "",
  });
  const router = useRouter();

  const handleSyncVault = async () => {
    setLoading(true);
    try {
      const progress = await mockSyncVault();
      setLearningProgress(progress);

      const financeInsight = await mockGenerateDomainInsights("Finance");
      const travelInsight = await mockGenerateDomainInsights("Travel");
      const subscriptionInsight = await mockGenerateDomainInsights(
        "Subscription"
      );

      setInsights({
        finance: financeInsight,
        travel: travelInsight,
        subscription: subscriptionInsight,
      });

      toast.success("Vault synced and insights updated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update learning");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  // Define domains as keyof typeof learningProgress to satisfy TypeScript
  const domains: Array<keyof typeof learningProgress> = [
    "finance",
    "travel",
    "subscription",
  ];

  const domainTitles = {
    finance: "Finance Agent",
    travel: "Travel Agent",
    subscription: "Subscription Agent",
  };

  const domainDescriptions = {
    finance:
      "Analyzes your spending patterns and offers optimization insights.",
    travel: "Learns from your past trips to personalize future travel advice.",
    subscription:
      "Tracks recurring payments and suggests smart cancellations or alternatives.",
  };

  const handleViewRecommendations = (domain: keyof typeof learningProgress) => {
    router.push(`/dashboard/agent/recommendations?domain=${domain}`);
  };

  return (
    <div className=" mx-auto p-6 flex flex-col gap-6">
      <h2 className="text-3xl font-bold text-center">Agent Learning</h2>

      {/* Sync Vault Button */}
      <Button
        onClick={handleSyncVault}
        disabled={loading}
        className="w-fit mx-auto flex items-center justify-center gap-2"
      >
        {loading ? (
          <Loader2 className="animate-spin w-5 h-5" />
        ) : (
          <RefreshCw className="w-5 h-5" />
        )}
        {loading ? "Syncing Vault..." : "Sync Vault & Update Learning"}
      </Button>

      {/* Learning Progress */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
        {domains.map((domain) => (
          <Card key={domain}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="w-5 h-5 text-primary" />{" "}
                {domain.charAt(0).toUpperCase() + domain.slice(1)} Agent
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {domainDescriptions[domain]}
              </p>

              <div className="space-y-1">
                <Progress
                  value={learningProgress[domain]}
                  className="h-2 rounded-lg bg-muted/20"
                />
                <p className="text-sm text-muted-foreground">
                  Learning Progress: {learningProgress[domain]}%
                </p>
              </div>
              {insights[domain] && (
                <div className="bg-muted/10 p-3 rounded-lg space-y-1">
                  <p>{insights[domain]}</p>
                </div>
              )}
              <Button
                variant="default"
                className="w-full flex items-center justify-center gap-2"
                onClick={() =>
                  router.push(
                    `/dashboard/agent/recommendations?domain=${domain}`
                  )
                }
              >
                View Recommendations
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
