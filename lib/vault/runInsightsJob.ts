export type InsightsJobResult = {
  category: string;
  summary: string;
  insightsCID: string;
  categoryCID?: string;
};

export type VaultInsightsUpdater = (args: {
  rootHash: string;
  category: string;
  insightsCID: string;
}) => Promise<string | void>;

export class ComputeInsightsError extends Error {
  code?: string;
  title?: string;

  constructor(message: string, meta?: { code?: string; title?: string }) {
    super(message);
    this.name = "ComputeInsightsError";
    this.code = meta?.code;
    this.title = meta?.title;
  }
}

/** Run inference via API (user-funded ledger) then register insights on vault with the user's wallet. */
export async function runInsightsJob(
  params: {
    rootHash: string;
    fileName: string;
    content: string;
    chainId: number;
    wallet?: string;
  },
  updateVault: VaultInsightsUpdater
): Promise<InsightsJobResult> {
  const res = await fetch("/api/computeInsights", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const data = (await res.json()) as {
    error?: string;
    code?: string;
    title?: string;
    category?: string;
    summary?: string;
    insightsCID?: string;
    categoryCID?: string;
  };

  if (!res.ok) {
    throw new ComputeInsightsError(data.error || "Compute failed", {
      code: data.code,
      title: data.title,
    });
  }

  if (!data.category || !data.summary || !data.insightsCID) {
    throw new ComputeInsightsError("Incomplete insights response from server");
  }

  await updateVault({
    rootHash: params.rootHash,
    category: data.category,
    insightsCID: data.insightsCID,
  });

  return {
    category: data.category,
    summary: data.summary,
    insightsCID: data.insightsCID,
    categoryCID: data.categoryCID,
  };
}
