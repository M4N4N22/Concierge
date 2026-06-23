"use client";

import Link from "next/link";
import { JourneyStepHeader } from "@/components/dashboard/JourneyStepHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Sparkles } from "lucide-react";

export default function VaultChatPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <JourneyStepHeader
        step={3}
        journeyId="chat"
        title="Talk to your data"
        tagline="Private vault chat"
        description="Ask natural-language questions across everything in your vault. Answers are grounded only in your uploaded documents — never generic web knowledge."
        badge="Coming soon"
      />

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center text-center py-16 px-6 gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <MessageSquare className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Vault chat is on the roadmap</h2>
          <p className="text-muted-foreground max-w-md">
            Complete Steps 1–2 first so your files are categorized and summarized.
            Chat will use those insights plus 0G Compute for contextual Q&A.
          </p>
          <Button asChild variant="default">
            <Link href="/dashboard/vault/insights" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Go to AI Insights (Step 2)
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
