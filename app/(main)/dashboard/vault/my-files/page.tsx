"use client";

import { useState } from "react";
import Link from "next/link";
import { JourneyStepHeader } from "@/components/dashboard/JourneyStepHeader";
import UploadArea from "@/components/vault/UploadArea";
import FileList from "@/components/vault/FileList";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export default function MyFilesPage() {
  const [vaultRefresh, setVaultRefresh] = useState(0);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <JourneyStepHeader
        step={1}
        journeyId="upload"
        title="Upload your data"
        tagline="Vault ingestion"
        description="Add files from your device or try a sample receipt. Everything is encrypted on 0G Storage and registered in your on-chain vault — you stay in control."
      />

      <UploadArea onVaultUpdate={() => setVaultRefresh((n) => n + 1)} />

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-lg font-semibold">Your vault files</h2>
              <p className="text-sm text-muted-foreground">
                On-chain registry — click a file to preview from 0G Storage
              </p>
            </div>
            <Button asChild>
              <Link href="/dashboard/vault/insights" className="gap-2">
                Continue to Insights
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <FileList refreshToken={vaultRefresh} />
        </CardContent>
      </Card>

      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-foreground">What happens next?</p>
          <p className="text-muted-foreground mt-1">
            After upload, head to{" "}
            <Link
              href="/dashboard/vault/insights"
              className="text-primary font-medium hover:underline"
            >
              Insights
            </Link>{" "}
            to let 0G Compute categorize and summarize each file.
          </p>
        </div>
      </div>
    </div>
  );
}
