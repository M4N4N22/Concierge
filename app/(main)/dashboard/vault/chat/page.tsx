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
        description="Analyst, Risk, and Security debate your evidence on 0G Compute. An Agentic Firewall seals unsafe actions, then you bind the transcript to your Agentic ID as Board Chair."
      />

      <WarRoom />
    </div>
  );
}
