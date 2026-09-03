import { NextRequest, NextResponse } from "next/server";
import { run0GInference } from "@/lib/0gCompute";
import { authorizeBoardRequest } from "@/lib/boardAuth";
import { buildCasualChatPrompt } from "@/lib/chat/casualPrompt";
import { modelLabel } from "@/lib/computeModels";
import { resolveLiveRouterModel } from "@/lib/computeRouterModels";
import { classifyComputeError } from "@/lib/computeErrors";
import type { VaultEvidence } from "@/lib/evidence";

export const maxDuration = 60;

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
    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : typeof body.question === "string"
          ? body.question.trim()
          : "";

    const auth = await authorizeBoardRequest(req, {
      ...body,
      question: message,
      mode: "fast",
    });
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    if (!message) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const evidence = Array.isArray(body.evidence)
      ? body.evidence.filter(isEvidence)
      : [];
    const modelRaw = typeof body.model === "string" ? body.model : undefined;
    const resolvedModel = await resolveLiveRouterModel(modelRaw);
    const chainId =
      typeof body.chainId === "number"
        ? body.chainId
        : Number(body.chainId) || undefined;

    const displayName =
      typeof body.displayName === "string" ? body.displayName : undefined;
    const bio = typeof body.bio === "string" ? body.bio : undefined;

    const prompt = buildCasualChatPrompt({
      message,
      displayName,
      bio,
      evidence,
    });

    const reply = await run0GInference(prompt, chainId, {
      json: false,
      model: resolvedModel,
    });

    return NextResponse.json({
      reply: reply.trim(),
      model: resolvedModel,
      modelLabel: modelLabel(resolvedModel),
      computeMode: "router",
    });
  } catch (err) {
    console.error("[chat]", err);
    const classified = classifyComputeError(err);
    return NextResponse.json(
      {
        error: classified.message,
        code: classified.code,
        title: classified.title,
      },
      { status: 503 }
    );
  }
}
