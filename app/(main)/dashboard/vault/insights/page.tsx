"use client";

import { useState } from "react";
import AIInsights from "@/components/vault/InsightsPanel";
import ModelDashboard from "@/components/vault/ModelLedgerDashboard";
import DemoVaultWizard from "@/components/vault/VaultComputeDemo";
import { Button } from "@/components/ui/button";

export default function InsightsPage() {
  const [showInsights, setShowInsights] = useState(false);
  const [showDemoWizard, setShowDemoWizard] = useState(false);

  return (
    <main className="p-6 relative">
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold flex items-baseline gap-4">
            AI-Powered File Insights & Organization
          </h1>
          <p className="text-lg text-muted font-medium mt-2">
            Powered by{" "}
            <span className="font-semibold text-primary">0G Storage</span> and{" "}
            <span className="font-semibold text-primary">0G Compute</span>.
          </p>
          <p className="text-lg text-muted font-medium mt-2">
            Click on{" "}
            <span className="font-semibold text-primary">Get Insights</span> to
            let AI categorize your files into folders based on type or content,
            and generate a concise summary for each file.
          </p>
          <p className="text-sm text-muted mt-2">
            Note: Insights will not be generated for files that are on-chain but
            have not yet been uploaded or indexed on 0G Storage.
          </p>
        </div>

        {/* Try Demo Wizard Button */}
        <Button
          variant="default"
          onClick={() => setShowDemoWizard(true)}
        >
          Try Demo Wizard
        </Button>
      </div>

      {/* Main Content */}
      {!showInsights && (
        <div className="space-y-4">
          <ModelDashboard />
          <Button
            variant="default"
            className="flex justify-center w-72 mx-auto"
            onClick={() => setShowInsights(true)}
          >
            Continue
          </Button>
        </div>
      )}
      {showInsights && <AIInsights />}

      {/* Custom Modal for Demo Wizard */}
      {showDemoWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-card backdrop-blur-xl rounded-3xl shadow-xl relative max-w-5xl max-h-[90vh] overflow-y-auto ">

            <Button
              variant="ghost"
              className="absolute top-4 right-4"
              onClick={() => setShowDemoWizard(false)}
            >
              ✕
            </Button>
            <DemoVaultWizard />
          </div>
        </div>
      )}
    </main>
  );
}
