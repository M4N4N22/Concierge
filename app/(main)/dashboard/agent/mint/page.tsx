// app/my-agent/page.tsx
"use client";

import { useState } from "react";
import INFTAgentUI from "@/components/MyAgent/INFTAgentUI";
import INFTAgentDemoMock from "@/components/MyAgent/INFTAgentDemo";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

export default function MyAgentPage() {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <main className="mx-auto p-6 flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex justify-between items-center gap-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">
            Mint Your <span className="text-primary">Agentic ID</span>
          </h1>
          <p className="text-foreground/70">
            Mint your personal Agentic ID on 0G Chain — an onchain AI agent bound to
            your vault, trained on your private data.
          </p>
<p className="text-foreground/60">
  Powered by <span className="font-semibold text-primary">0G</span> Storage and Compute.
  Your agent evolves as you upload documents and generate insights.
</p>

        </div>

        {/* Demo Wizard Toggle */}
        <Button
     
          size="sm"
          onClick={() => setShowDemo((prev) => !prev)}
          className="flex items-center gap-2"
        >
         {showDemo ? "Close Demo" : "Try Demo Wizard"}
        </Button>
      </div>

      {/* Conditional Rendering: Only one UI at a time */}
      {showDemo ? (
        <div className="shadow rounded-lg p-4">
          <INFTAgentDemoMock />
        </div>
      ) : (
        <div className="shadow rounded-lg p-4">
          <INFTAgentUI />
        </div>
      )}
    </main>
  );
}
