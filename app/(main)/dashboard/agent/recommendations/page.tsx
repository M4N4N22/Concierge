import { Suspense } from "react";
import AgentRecommendations from "@/components/MyAgent/AgentRecommendations";

export default function AgentRecommendationsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AgentRecommendations />
    </Suspense>
  );
}
