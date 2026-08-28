import { run0GInference } from "@/lib/0gCompute";
import type { VaultEvidence } from "@/lib/evidence";
import {
  agentTurnPrompt,
  BOARD_AGENTS,
  chairPrompt,
  fastBoardPrompt,
  formatEvidenceBrief,
} from "./agents";
import {
  asVerdict,
  buildFallbackSession,
  parseJsonLoose,
} from "./fallback";
import { sealBoardSession } from "./guard";
import {
  createBoardSessionId,
  type BoardConsensus,
  type BoardSession,
  type BoardTurn,
} from "./types";

type TurnPayload = {
  stance?: string;
  argument?: string;
  concerns?: string[];
  citations?: string[];
};

type FastPayload = {
  turns?: Array<TurnPayload & { role?: string }>;
  consensus?: {
    verdict?: string;
    summary?: string;
    actions?: string[];
    dissent?: string[];
    confidence?: number;
  };
};

function toTurn(
  role: "analyst" | "risk" | "security",
  payload: TurnPayload | null
): BoardTurn {
  return {
    role,
    name: BOARD_AGENTS[role].name,
    stance: asVerdict(payload?.stance, "revise"),
    argument:
      payload?.argument?.trim() ||
      `${BOARD_AGENTS[role].name} could not produce a structured argument.`,
    concerns: Array.isArray(payload?.concerns)
      ? payload!.concerns!.map(String).slice(0, 6)
      : [],
    citations: Array.isArray(payload?.citations)
      ? payload!.citations!.map(String).slice(0, 8)
      : [],
  };
}

function toConsensus(
  payload: FastPayload["consensus"] | null,
  turns: BoardTurn[]
): BoardConsensus {
  return {
    verdict: asVerdict(payload?.verdict, "revise"),
    summary:
      payload?.summary?.trim() ||
      `Board reviewed ${turns.length} agent turns without a clear chair summary.`,
    actions: Array.isArray(payload?.actions)
      ? payload!.actions!.map(String).slice(0, 6)
      : ["Re-run board with more evidence"],
    dissent: Array.isArray(payload?.dissent)
      ? payload!.dissent!.map(String).slice(0, 6)
      : [],
    confidence:
      typeof payload?.confidence === "number"
        ? Math.max(0, Math.min(1, payload.confidence))
        : 0.5,
  };
}

function finalize(
  session: BoardSession,
  bind?: { agentTokenId?: string; wallet?: string }
): BoardSession {
  return sealBoardSession(session, bind);
}

async function runLiveBoard(
  question: string,
  evidence: VaultEvidence[]
): Promise<BoardSession> {
  const evidenceBrief = formatEvidenceBrief(evidence);
  const turns: BoardTurn[] = [];

  for (const role of ["analyst", "risk", "security"] as const) {
    const raw = await run0GInference(
      agentTurnPrompt({ role, question, evidenceBrief, priorTurns: turns })
    );
    const parsed = parseJsonLoose<TurnPayload>(raw);
    turns.push(toTurn(role, parsed));
  }

  const chairRaw = await run0GInference(
    chairPrompt({ question, evidenceBrief, turns })
  );
  const chairParsed = parseJsonLoose<FastPayload["consensus"]>(chairRaw);

  return {
    schemaVersion: 1,
    id: createBoardSessionId(),
    question,
    evidenceIds: evidence.map((e) => e.id),
    turns,
    consensus: toConsensus(chairParsed, turns),
    computeMode: "live",
    modelNotes: "Sequential Analyst → Risk → Security → Chair on 0G Compute",
    createdAt: new Date().toISOString(),
  };
}

async function runFastBoard(
  question: string,
  evidence: VaultEvidence[]
): Promise<BoardSession> {
  const evidenceBrief = formatEvidenceBrief(evidence);
  const raw = await run0GInference(fastBoardPrompt({ question, evidenceBrief }));
  const parsed = parseJsonLoose<FastPayload>(raw);

  const roleOrder = ["analyst", "risk", "security"] as const;
  const turns: BoardTurn[] = roleOrder.map((role) => {
    const hit =
      parsed?.turns?.find((t) => t.role === role) ||
      parsed?.turns?.[roleOrder.indexOf(role)];
    return toTurn(role, hit ?? null);
  });

  return {
    schemaVersion: 1,
    id: createBoardSessionId(),
    question,
    evidenceIds: evidence.map((e) => e.id),
    turns,
    consensus: toConsensus(parsed?.consensus ?? null, turns),
    computeMode: "fast",
    modelNotes: "Single 0G Compute call returning multi-agent debate JSON",
    createdAt: new Date().toISOString(),
  };
}

export async function runBoardSession(input: {
  question: string;
  evidence: VaultEvidence[];
  mode?: "auto" | "live" | "fast" | "fallback";
  agentTokenId?: string;
  wallet?: string;
}): Promise<BoardSession> {
  const question =
    input.question.trim() ||
    "Review my vault evidence and recommend next actions.";
  const evidence = input.evidence ?? [];
  const mode = input.mode ?? "auto";
  const bind = {
    agentTokenId: input.agentTokenId,
    wallet: input.wallet,
  };

  if (mode === "fallback") {
    return finalize(buildFallbackSession(question, evidence), bind);
  }

  if (mode === "live") {
    try {
      return finalize(await runLiveBoard(question, evidence), bind);
    } catch (err) {
      const fallback = buildFallbackSession(question, evidence);
      fallback.modelNotes = `Live compute failed (${err instanceof Error ? err.message : "error"}); used offline fallback.`;
      return finalize(fallback, bind);
    }
  }

  if (mode === "fast") {
    try {
      return finalize(await runFastBoard(question, evidence), bind);
    } catch (err) {
      const fallback = buildFallbackSession(question, evidence);
      fallback.modelNotes = `Fast compute failed (${err instanceof Error ? err.message : "error"}); used offline fallback.`;
      return finalize(fallback, bind);
    }
  }

  try {
    return finalize(await runFastBoard(question, evidence), bind);
  } catch (fastErr) {
    try {
      const live = await runLiveBoard(question, evidence);
      live.modelNotes = `Fast mode failed (${fastErr instanceof Error ? fastErr.message : "error"}); completed via live sequential agents.`;
      return finalize(live, bind);
    } catch (liveErr) {
      const fallback = buildFallbackSession(question, evidence);
      fallback.modelNotes = `Compute unavailable (fast: ${
        fastErr instanceof Error ? fastErr.message : "error"
      }; live: ${liveErr instanceof Error ? liveErr.message : "error"}). Offline fallback.`;
      return finalize(fallback, bind);
    }
  }
}
