import { NextRequest, NextResponse } from "next/server";
import { run0GInference } from "@/lib/0gCompute";

export type VaultTipContext = {
  category: string;
  summary?: string;
  uploadedAt?: string;
  rootHash?: string;
};

export type ChatTipQuestion = {
  title: string;
  description: string;
  prompt: string;
};

function parseTipsResponse(raw: string): {
  summary?: string;
  questions: ChatTipQuestion[];
} {
  try {
    const parsed = JSON.parse(raw) as {
      summary?: string;
      questions?: ChatTipQuestion[];
    };
    const questions = (parsed.questions ?? [])
      .filter((q) => q?.prompt?.trim())
      .slice(0, 4)
      .map((q) => ({
        title: String(q.title ?? "Ask your vault").slice(0, 64),
        description: String(q.description ?? "").slice(0, 120),
        prompt: String(q.prompt).trim().slice(0, 280),
      }));

    const seen = new Set<string>();
    const unique = questions.filter((q) => {
      const key = q.prompt.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return { summary: parsed.summary, questions: unique };
  } catch {
    return { questions: [] };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const vaultContext = (Array.isArray(body.vaultContext)
      ? body.vaultContext
      : []) as VaultTipContext[];

    const lines = vaultContext
      .filter((f) => f?.category)
      .map((f, i) => {
        const when = f.uploadedAt ? ` · ${f.uploadedAt}` : "";
        const hash = f.rootHash ? ` · ${f.rootHash.slice(0, 10)}…` : "";
        return `${i + 1}. [${f.category}]${when}${hash}\n   ${(f.summary || "no insight summary yet").slice(0, 400)}`;
      });

    if (!lines.length) {
      return NextResponse.json({
        summary: "Add files to your vault and run Insights to get personalized questions.",
        questions: [
          {
            title: "Upload first",
            description: "Store files on 0G, then come back",
            prompt: "What should I upload to get started with Concierge?",
          },
        ],
      });
    }

    const prompt = `You are Concierge — a vault-backed personal assistant on 0G.
The user wants concrete questions they can ask about THEIR uploaded data (most recent first).

Respond ONLY with valid JSON:
{
  "summary": "one short sentence about what's in their vault right now",
  "questions": [
    { "title": "3-6 word label", "description": "half-line why this question fits their data", "prompt": "full natural-language question to send Concierge" }
  ]
}

Rules:
- Generate exactly 3 questions tailored to the categories and insight summaries below — NOT generic finance/travel/subscription templates unless that data is actually present.
- Each prompt must be askable against their vault evidence.
- Prefer recent uploads and specific details from summaries when available.
- Do not mention lenses, domains, or agent types.

Recent vault context:
${lines.join("\n\n")}`;

    const raw = await run0GInference(prompt, undefined, { json: true });
    const parsed = parseTipsResponse(raw);

    if (parsed.questions.length) {
      return NextResponse.json({
        summary:
          parsed.summary ||
          "Questions based on your recent vault uploads.",
        questions: parsed.questions,
      });
    }

    return NextResponse.json({
      summary: parsed.summary || raw.slice(0, 160),
      questions: [
        {
          title: "Vault overview",
          description: "Summarize everything loaded",
          prompt: "Summarize what my vault knows from recent uploads.",
        },
        {
          title: "Recent uploads",
          description: "Focus on the latest files",
          prompt: "What stands out in my most recent vault files?",
        },
        {
          title: "Follow up",
          description: "Gaps or next steps",
          prompt: "What should I ask next based on what's in my vault?",
        },
      ],
    });
  } catch (err) {
    console.error("[chatTips]", err);
    return NextResponse.json(
      { error: (err as Error).message || "Failed to generate tips" },
      { status: 500 }
    );
  }
}
