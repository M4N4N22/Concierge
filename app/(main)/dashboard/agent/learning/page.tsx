// app/my-agent/learning/page.tsx
"use client";

import { useState } from "react";
import AgentLearning from "@/components/MyAgent/AgentLearning";
import { Button } from "@/components/ui/button";

export default function LearningPage() {
  const [showLearning, setShowLearning] = useState(true); // can toggle if needed in future

  return (
    <main className="mx-auto p-6 flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex justify-between items-center gap-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">
            My <span className="text-primary">INFT</span> Agent Learning
          </h1>
          <p className="text-foreground/70">
            Here you can track the learning progress of your INFT Agent across multiple domains. 
            Each agent domain uses your vault data to generate insights and recommendations.
          </p>
          <p className="text-foreground/60">
            Powered by <span className="font-semibold text-primary">0G</span>, your vault data is securely 
            processed with AI compute. Learnings are updated per domain and can be viewed in real time.
          </p>
        </div>

        {/* Optional Toggle Button */}
        <Button
          size="sm"
          onClick={() => setShowLearning((prev) => !prev)}
          className="flex items-center gap-2"
        >
          {showLearning ? "Hide Learning" : "Show Learning"}
        </Button>
      </div>

      {/* Learning UI */}
      {showLearning && (
        <div className="">
          <AgentLearning />
        </div>
      )}
    </main>
  );
}
