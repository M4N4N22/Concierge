import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";
import { run0GInference } from "@/lib/0gCompute";
import { clientIp } from "@/lib/boardAuth";
import { withTipsWeeklyInference } from "@/lib/chatTipsQuota";
import {
  buildTipsFromContext,
  STATIC_VAULT_TIPS,
} from "@/lib/chat/vaultSuggestions";

export type VaultTipContext = {
  category: string;
  label: string;
  summary?: string;
  uploadedAt?: string;
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

function staticFallback(context: VaultTipContext[]) {
  return buildTipsFromContext(context);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const vaultContext = (Array.isArray(body.vaultContext)
    ? body.vaultContext
    : []) as VaultTipContext[];
  const wallet = typeof body.wallet === "string" ? body.wallet : "";

  if (!vaultContext.length) {
    return NextResponse.json({
      summary: "Feed files in Knowledge base to get personalized questions.",
      questions: STATIC_VAULT_TIPS.map(({ title, description, prompt }) => ({
        title,
        description,
        prompt,
      })),
      source: "static",
    });
  }

  const fallback = staticFallback(vaultContext);
  if (!isAddress(wallet)) {
    return NextResponse.json({ ...fallback, source: "static" });
  }

  const result = await withTipsWeeklyInference(
    wallet,
    clientIp(req),
    async () => {
      const lines = vaultContext
        .filter((f) => f?.label)
        .map((f, i) => {
          const when = f.uploadedAt ? ` (uploaded ${f.uploadedAt})` : "";
          return `${i + 1}. ${f.label}${when}\n   ${(f.summary || "No summary available").slice(0, 400)}`;
        });

      const prompt = `You are Concierge — a vault-backed personal assistant on 0G.
The user wants concrete questions they can ask about THEIR uploaded data (most recent first).

Respond ONLY with valid JSON:
{
  "summary": "one short friendly sentence about what's in their vault (no file hashes, no internal jargon)",
  "questions": [
    { "title": "3-6 word label", "description": "half-line why this question fits their data", "prompt": "full natural-language question to send Concierge" }
  ]
}

Rules:
- Generate exactly 3 questions tailored to the categories and summaries below — NOT generic templates unless that data is actually present.
- Titles and descriptions must be user-friendly — never show raw hashes, "unassigned", or "not in agent knowledge".
- Each prompt must be askable against their vault evidence.
- Prefer recent uploads and specific details from summaries when available.

Recent vault context:
${lines.join("\n\n")}`;

      const raw = await run0GInference(prompt, undefined, { json: true });
      const parsed = parseTipsResponse(raw);
      if (!parsed.questions.length) {
        throw new Error("Tips model returned no questions");
      }
      return {
        summary:
          parsed.summary || "Questions based on your knowledge base.",
        questions: parsed.questions,
      };
    }
  );

  if (result.payload?.questions.length) {
    return NextResponse.json({
      summary: result.payload.summary,
      questions: result.payload.questions,
      source: result.source,
      resetsAt: result.resetsAt,
    });
  }

  return NextResponse.json({
    ...fallback,
    source: "static",
    resetsAt: result.resetsAt,
  });
}
