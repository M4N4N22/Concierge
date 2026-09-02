import type { VaultEvidence } from "@/lib/evidence";
import { BOARD_AGENTS } from "./agents";
import {
  createBoardSessionId,
  type BoardConsensus,
  type BoardSession,
  type BoardTurn,
  type BoardVerdict,
} from "./types";

function pickAmounts(evidence: VaultEvidence[]): number[] {
  const amounts: number[] = [];
  for (const e of evidence) {
    for (const f of e.facts) {
      if (
        typeof f.value === "number" &&
        /amount|total|balance|native/i.test(f.key)
      ) {
        amounts.push(f.value);
      }
    }
  }
  return amounts;
}

/** Deterministic board debate when 0G Compute is unavailable — still schema-valid. */
export function buildFallbackSession(
  question: string,
  evidence: VaultEvidence[]
): BoardSession {
  const evidenceIds = evidence.map((e) => e.id);
  const types = [...new Set(evidence.map((e) => e.type))];
  const amounts = pickAmounts(evidence);
  const total = amounts.reduce((a, b) => a + b, 0);
  const hasWallet = types.includes("wallet");
  const hasSpend = types.includes("spend") || types.includes("briefing");
  const citation = evidenceIds.slice(0, 3);

  const analystArg = evidence.length
    ? `Based on ${evidence.length} knowledge file(s) (${types.join(", ") || "mixed"}), the board should treat this as a structured review of the user's vault context${
        amounts.length ? ` covering ~$${total.toFixed(2)} in numeric facts` : ""
      }. Proposed focus: ${question.slice(0, 160)}`
    : `No vault evidence yet. Propose collecting a wallet sync and one spend/briefing pack before any action on: ${question.slice(0, 120)}`;

  const riskConcerns = [
    amounts.length === 0 ? "Weak numeric grounding in evidence" : "Amounts may be incomplete or currency-ambiguous",
    evidence.some((e) => e.confidence < 0.6)
      ? "Low-confidence packs present"
      : "Confidence acceptable but not verified onchain beyond CIDs",
  ];

  const securityConcerns = [
    hasWallet
      ? "Review outbound transfers and approvals before acting"
      : "No wallet snapshot — onchain drain risk unknown",
    "Do not sign blind transactions from AI recommendations",
  ];

  const turns: BoardTurn[] = [
    {
      role: "analyst",
      name: BOARD_AGENTS.analyst.name,
      stance: evidence.length ? "revise" : "abstain",
      argument: analystArg,
      concerns: evidence.length ? [] : ["Insufficient evidence"],
      citations: citation,
    },
    {
      role: "risk",
      name: BOARD_AGENTS.risk.name,
      stance: "revise",
      argument: hasSpend
        ? "Spending/briefing evidence exists, but concentration and recurrence risk need human confirmation before execution."
        : "Financial exposure is under-specified. Require clearer spend or portfolio evidence before approval.",
      concerns: riskConcerns,
      citations: citation,
    },
    {
      role: "security",
      name: BOARD_AGENTS.security.name,
      stance: hasWallet ? "revise" : "reject",
      argument: hasWallet
        ? "Wallet evidence is present. Block any recommendation that implies unlimited approvals or unverified contract interaction."
        : "Reject execution guidance until a wallet sync file is registered.",
      concerns: securityConcerns,
      citations: citation,
    },
  ];

  const consensus: BoardConsensus = {
    verdict: evidence.length ? "revise" : "abstain",
    summary: evidence.length
      ? `Chair consensus (offline fallback): agents reviewed ${evidence.length} pack(s). Verdict is revise — strengthen evidence and explicitly gate any onchain action behind Security review. Question under review: ${question}`
      : `Chair consensus (offline fallback): abstain until vault evidence exists. Start with wallet sync + one briefing.`,
    actions: evidence.length
      ? [
          "Confirm top cited facts with the user",
          "Add missing wallet or CSV evidence if gaps remain",
          "Re-run board before any transaction",
        ]
      : ["Sync wallet evidence", "Paste a decision briefing", "Reconvene the board"],
    dissent: [
      "Analyst wants progress; Security prioritizes veto until proofs are stronger",
    ],
    confidence: evidence.length ? 0.55 : 0.25,
  };

  return {
    schemaVersion: 1,
    id: createBoardSessionId(),
    question,
    evidenceIds,
    turns,
    consensus,
    computeMode: "fallback",
    modelNotes: "Generated locally — 0G Compute unavailable or skipped",
    createdAt: new Date().toISOString(),
  };
}

export function parseJsonLoose<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
}

const VERDICTS: BoardVerdict[] = ["approve", "reject", "revise", "abstain"];

export function asVerdict(v: unknown, fallback: BoardVerdict): BoardVerdict {
  return typeof v === "string" && VERDICTS.includes(v as BoardVerdict)
    ? (v as BoardVerdict)
    : fallback;
}
