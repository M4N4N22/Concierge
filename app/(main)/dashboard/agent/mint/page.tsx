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
        title="Mint your Board Chair"
        tagline="Agentic ID owns Advisor transcripts"
        description="Create an ERC-721 Agentic ID bound to your vault. It can bind Talk and Trade transcripts via profile URI + firewall seal hash."
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
