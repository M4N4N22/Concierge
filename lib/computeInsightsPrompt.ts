export function buildInsightsPrompt(content: string): string {
  return `
You are a service that MUST output valid JSON.
Analyze the uploaded file and respond ONLY with JSON in this exact format:
{ "category": "short label", "summary": "concise summary" }

File Content:
${content}
  `.trim();
}

export function parseInsightsOutput(aiOutput: string): {
  category: string;
  summary: string;
} {
  let category = "unassigned";
  let summary = aiOutput;
  try {
    const parsed = JSON.parse(aiOutput) as {
      category?: string;
      summary?: string;
    };
    category = parsed.category ?? "unassigned";
    summary = parsed.summary ?? aiOutput;
  } catch {
    // keep raw output as summary
  }
  return { category, summary };
}
