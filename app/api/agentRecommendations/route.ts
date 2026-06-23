import { NextRequest, NextResponse } from "next/server";
import { run0GInference } from "@/lib/0gCompute";
import { AGENT_DOMAINS, DOMAIN_META, type AgentDomain } from "@/lib/domains";

export async function POST(req: NextRequest) {
  try {
    const { domain, vaultContext } = await req.json();

    if (!domain || !AGENT_DOMAINS.includes(domain)) {
      return NextResponse.json({ error: "Invalid domain" }, { status: 400 });
    }

    const contextLines: string[] = Array.isArray(vaultContext)
      ? vaultContext
          .filter((f: { category?: string; summary?: string }) => f?.category)
          .map(
            (f: { category: string; summary?: string }) =>
              `- [${f.category}] ${f.summary || "no summary yet"}`
          )
      : [];

    const meta = DOMAIN_META[domain as AgentDomain];

    const prompt = `You are Concierge's ${meta.title}, powered by 0G Compute.
Based on the user's private vault file insights below, respond ONLY with valid JSON:
{
  "summary": "one sentence overview",
  "recommendations": ["actionable insight 1", "actionable insight 2", "actionable insight 3"]
}

Domain focus: ${domain}
Vault insights:
${contextLines.length ? contextLines.join("\n") : "No files categorized yet — give general best-practice recommendations for this domain."}`;

    const raw = await run0GInference(prompt);
    let parsed: { summary?: string; recommendations?: string[] };
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {
        summary: raw.slice(0, 200),
        recommendations: [raw.slice(0, 300)],
      };
    }

    return NextResponse.json({
      domain,
      title: meta.title,
      description: meta.description,
      summary: parsed.summary || meta.description,
      recommendations: parsed.recommendations?.length
        ? parsed.recommendations
        : ["Upload more documents to your vault for personalized insights."],
    });
  } catch (err) {
    console.error("[agentRecommendations]", err);
    return NextResponse.json(
      { error: (err as Error).message || "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}
