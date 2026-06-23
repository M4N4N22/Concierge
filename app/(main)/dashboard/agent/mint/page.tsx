// app/(main)/dashboard/agent/mint/page.tsx
"use client";

import { useState } from "react";
import INFTAgentUI from "@/components/MyAgent/INFTAgentUI";
import INFTAgentDemoMock from "@/components/MyAgent/INFTAgentDemo";
import { JourneyStepHeader } from "@/components/dashboard/JourneyStepHeader";
import { Button } from "@/components/ui/button";

export default function MyAgentPage() {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <main className="max-w-4xl mx-auto space-y-8">
      <JourneyStepHeader
        step={4}
        journeyId="agentic-id"
        title="Mint your Agentic ID"
        tagline="Onchain personal agent"
        description="Create an ERC-721 agent token bound to your vault. Your Agentic ID fingerprints your data-backed intelligence on 0G Chain — the gateway to domain learning, delegation, and future marketplace features."
        actions={
          <Button size="sm" variant="outline" onClick={() => setShowDemo((p) => !p)}>
            {showDemo ? "Use production mint" : "Try demo wizard"}
          </Button>
        }
      />

      {showDemo ? <INFTAgentDemoMock /> : <INFTAgentUI />}
    </main>
  );
}
