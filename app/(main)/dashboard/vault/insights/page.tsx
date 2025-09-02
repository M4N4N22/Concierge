import AIInsights from "@/components/vault/InsightsPanel";

export default function InsightsPage() {
  return (
    <main className="p-6">
      <div className="mb-6 space-y-2">
        <h1 className="text-3xl font-bold flex items-baseline gap-4">
          AI-Powered File Insights & Organization
          <p className="text-lg text-muted font-medium mt-4">
          Powered by{" "}
          <span className="font-semibold text-primary">0G Storage</span> and{" "}
          <span className="font-semibold text-primary">0G Compute</span>.
        </p>
        </h1>
      
        <p className="text-lg text-muted font-medium">
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

      <AIInsights />
    </main>
  );
}
