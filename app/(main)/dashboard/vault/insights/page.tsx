import AIInsights from "@/components/vault/InsightsPanel";

export default function InsightsPage() {
  return (
    <main className="p-6">
      <div className="mb-6 space-y-2">
        <h1 className="text-3xl font-bold">
          AI Insights for Your Uploaded Files
        </h1>
        <p className="text-lg text-muted font-medium">
          Powered by <span className="font-semibold text-primary">0G Storage</span> and{" "}
          <span className="font-semibold text-primary">0G Compute</span>.
        </p>
        <p className="text-sm text-muted">
          Note: Insights will not be generated for files that are on-chain but
          have not yet been uploaded or indexed on 0G Storage.
        </p>
      </div>

      <AIInsights />
    </main>
  );
}
