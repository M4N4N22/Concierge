import { Suspense } from "react";
import AgentRecommendations from "@/components/MyAgent/AgentRecommendations";
import { Loader2 } from "lucide-react";

export default function AgentRecommendationsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading recommendations…</span>
        </div>
      }
    >
      <AgentRecommendations />
    </Suspense>
  );
}
