"use client";

import { useState } from "react";
import AIInsights from "@/components/vault/InsightsPanel";
import ModelDashboard from "@/components/vault/ModelLedgerDashboard";

export default function InsightsPage() {
  const [showInsights, setShowInsights] = useState(false);

  return (
    <main className="p-6">
      <div className="mb-6 space-y-2">
        <h1 className="text-3xl font-bold flex items-baseline gap-4">
          AI-Powered File Insights & Organization
        </h1>
        <p className="text-lg text-muted font-medium mt-2">
          Powered by{" "}
          <span className="font-semibold text-primary">0G Storage</span> and{" "}
          <span className="font-semibold text-primary">0G Compute</span>.
        </p>
        <p className="text-lg text-muted font-medium mt-2">
          Click on <span className="font-semibold text-primary">Get Insights</span> to
          let AI categorize your files into folders based on type or content,
          and generate a concise summary for each file.
        </p>
        <p className="text-sm text-muted mt-2">
          Note: Insights will not be generated for files that are on-chain but
          have not yet been uploaded or indexed on 0G Storage.
        </p>
      </div>

      {!showInsights ? (
        <div className="space-y-4">
          <ModelDashboard />
          <button
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/80 transition"
            onClick={() => setShowInsights(true)}
          >
            Continue
          </button>
        </div>
      ) : (
        <AIInsights />
      )}
    </main>
  );
}
