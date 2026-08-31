"use client";

import { JourneyStepHeader } from "@/components/dashboard/JourneyStepHeader";
import WarRoom from "@/components/board/WarRoom";

export default function VaultChatPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <JourneyStepHeader
        step={3}
        journeyId="chat"
        title="War Room"
        tagline="Board"
        description="Analyst, Risk, and Security debate vault evidence on 0G Compute. Firewall seals actions; Agentic ID can bind the transcript. Trade proposals require a mandate + confirm."
      />
      <WarRoom />
    </div>
  );
}
