import { NextRequest, NextResponse } from "next/server";
import { runBoardSession } from "@/lib/board/orchestrate";
import { authorizeBoardRequest } from "@/lib/boardAuth";
import {
  parseAgentTokenId,
  walletHasAgentAccess,
} from "@/lib/agentAccess";
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
        { error: "Provide a question and/or agent knowledge files" },
        { status: 400 }
      );
    }

    const agentTokenId = parseAgentTokenId(body.agentTokenId);
    const chainId =
      typeof body.chainId === "number"
        ? body.chainId
        : Number(body.chainId) || undefined;

    // When an Agentic ID is claimed, enforce owner-or-renter via marketplace.hasAccess.
    if (agentTokenId !== null) {
      const access = await walletHasAgentAccess({
        wallet: auth.wallet,
        tokenId: agentTokenId,
        chainId,
      });
      if (!access.ok) {
        return NextResponse.json({ error: access.error }, { status: 403 });
      }
    }

    const session = await runBoardSession({
      question: auth.question,
      evidence,
      mode: auth.mode,
      agentTokenId:
        agentTokenId !== null ? agentTokenId.toString() : undefined,
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
