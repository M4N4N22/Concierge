"use client";

import { motion } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function AgentRecommendations() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const domain = searchParams.get("domain");

  const domainDetails: Record<
    string,
    { title: string; description: string; recommendations: string[] }
  > = {
    finance: {
      title: "Finance Agent",
      description:
        "Your Finance Agent analyzes your vault data to detect spending trends and optimize your savings.",
      recommendations: [
        "Reduce discretionary expenses by 10% next month.",
        "Set an automated alert for subscription renewals.",
        "Diversify savings across high-yield accounts.",
      ],
    },
    travel: {
      title: "Travel Agent",
      description:
        "Your Travel Agent studies your past trips and preferences to plan better getaways.",
      recommendations: [
        "Book flights 6 weeks in advance for 20% cheaper fares.",
        "Explore destinations matching your last trip’s climate.",
        "Try co-living stays for social, low-cost travel experiences.",
      ],
    },
    subscription: {
      title: "Subscription Agent",
      description:
        "Your Subscription Agent monitors recurring payments and suggests cost optimizations.",
      recommendations: [
        "Cancel rarely used subscriptions saving ₹450/month.",
        "Bundle streaming plans to reduce redundancy.",
        "Track your app trial periods to prevent accidental renewals.",
      ],
    },
  };

  const data = domain ? domainDetails[domain] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6 max-w-5xl mx-auto"
    >
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold tracking-tight flex justify-center items-center gap-2">
          {data ? (
            <>
              <Sparkles className="w-6 h-6 text-primary" />
              {data.title} Recommendations
            </>
          ) : (
            "All Agent Recommendations"
          )}
        </h1>
        <p className="text-foreground/70 max-w-2xl mx-auto">
          {data
            ? data.description
            : "Select a specific domain from Learning to view specialized insights."}
        </p>
      </div>

      {/* Recommendations Grid */}
      {data ? (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1 },
            },
          }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6"
        >
          {data.recommendations.map((rec, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, y: 15 },
                visible: { opacity: 1, y: 0 },
              }}
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
      ) : (
        <Card className="text-center py-10">
          <CardContent className="text-foreground/60">
            No domain selected. Return to Learning to view personalized
            recommendations.
          </CardContent>
        </Card>
      )}

      {/* Back Button at Bottom */}
      <div className="flex justify-center pt-8">
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
