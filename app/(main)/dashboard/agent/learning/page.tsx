"use client";

import AgentLearning from "@/components/MyAgent/AgentLearning";
import { JourneyStepHeader } from "@/components/dashboard/JourneyStepHeader";

export default function LearningPage() {
  return (
    <main className="max-w-5xl mx-auto space-y-8">
      <JourneyStepHeader
        step={4}
        journeyId="agentic-id"
        title="Domain learning"
        tagline="Multi-agent intelligence"
        description="One vault powers finance, travel, and subscription agents. Sync your on-chain files to see how each domain learns from your categorized insights."
      />
      <AgentLearning />
    </main>
  );
}
