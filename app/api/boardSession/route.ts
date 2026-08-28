import { NextRequest, NextResponse } from "next/server";
import { runBoardSession } from "@/lib/board/orchestrate";
import { authorizeBoardRequest } from "@/lib/boardAuth";
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
    const body = (await req.json()) as Record<string, unknown>;
    const auth = await authorizeBoardRequest(req, body);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const evidence = Array.isArray(body.evidence)
      ? body.evidence.filter(isEvidence)
      : [];

    if (!auth.question.trim() && evidence.length === 0) {
      return NextResponse.json(
        { error: "Provide a question and/or evidence packs" },
        { status: 400 }
      );
    }

    const agentTokenId =
      typeof body.agentTokenId === "string" ? body.agentTokenId : undefined;

    const session = await runBoardSession({
      question: auth.question,
      evidence,
      mode: auth.mode,
      agentTokenId,
      wallet: auth.wallet,
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
