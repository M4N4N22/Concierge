import { NextRequest, NextResponse } from "next/server";
import { runBoardSession } from "@/lib/board/orchestrate";
import type { VaultEvidence } from "@/lib/evidence";

export const maxDuration = 120;

function isEvidence(x: unknown): x is VaultEvidence {
  if (!x || typeof x !== "object") return false;
  const e = x as VaultEvidence;
  return (
    typeof e.id === "string" &&
    typeof e.type === "string" &&
    typeof e.title === "string" &&
    Array.isArray(e.facts)
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const question = typeof body.question === "string" ? body.question : "";
    const mode = body.mode as "auto" | "live" | "fast" | "fallback" | undefined;
    const agentTokenId =
      typeof body.agentTokenId === "string" ? body.agentTokenId : undefined;
    const wallet = typeof body.wallet === "string" ? body.wallet : undefined;
    const evidence = Array.isArray(body.evidence)
      ? body.evidence.filter(isEvidence)
      : [];

    if (!question.trim() && evidence.length === 0) {
      return NextResponse.json(
        { error: "Provide a question and/or evidence packs" },
        { status: 400 }
      );
    }

    const session = await runBoardSession({
      question,
      evidence,
      mode,
      agentTokenId,
      wallet,
    });
    return NextResponse.json({ session });
  } catch (err) {
    console.error("[boardSession]", err);
    return NextResponse.json(
      { error: (err as Error).message || "Board session failed" },
      { status: 500 }
    );
  }
}
