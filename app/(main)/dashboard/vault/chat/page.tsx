"use client";

import { JourneyStepHeader } from "@/components/dashboard/JourneyStepHeader";
import WarRoom from "@/components/board/WarRoom";

export default function VaultChatPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <JourneyStepHeader
        step={3}
        journeyId="chat"
        title="AI War Room"
        tagline="Multi-agent board on your evidence"
        description="Analyst, Risk, and Security agents debate selected vault evidence packs on 0G Compute, then the Chair records consensus, dissent, and actions — saved back to Storage as a verifiable transcript."
      />

      <WarRoom />
    </div>
  );
}
