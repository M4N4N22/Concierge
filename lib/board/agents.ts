import type { VaultEvidence } from "@/lib/evidence";
import type { BoardAgentRole, BoardTurn } from "./types";

export const BOARD_AGENTS: Record<
  BoardAgentRole,
  { name: string; mandate: string }
> = {
  analyst: {
    name: "Analyst Agent",
    mandate:
      "Synthesize vault evidence into a clear proposal. Cite specific facts. Be concrete and actionable.",
  },
  risk: {
    name: "Risk Agent",
    mandate:
      "Challenge the Analyst. Flag financial, operational, and uncertainty risks. Demand evidence for claims.",
  },
  security: {
    name: "Security Agent",
    mandate:
      "Audit for drain patterns, approvals, phishing, and unsafe onchain actions. Block reckless execution advice.",
  },
  chair: {
    name: "Board Chair",
    mandate:
      "Reach a verdict from the debate. Record consensus, dissent, and next actions. Prefer revise over blind approve.",
  },
};

export function formatEvidenceBrief(evidence: VaultEvidence[]): string {
  if (!evidence.length) return "No agent knowledge provided.";
  return evidence
    .map((e, i) => {
      const facts = e.facts
        .slice(0, 12)
        .map(
          (f) =>
            `  - ${f.key}: ${String(f.value)}${f.unit ? ` ${f.unit}` : ""} (c=${f.confidence ?? "?"})`
        )
        .join("\n");
      return `[${i + 1}] id=${e.id} type=${e.type} source=${e.source} confidence=${e.confidence}
title: ${e.title}
summary: ${e.summary}
facts:
${facts || "  (none)"}`;
    })
    .join("\n\n");
}

export function formatPriorTurns(turns: BoardTurn[]): string {
  if (!turns.length) return "No prior turns.";
  return turns
    .map(
      (t) =>
        `${t.name} (${t.role}) [${t.stance}]: ${t.argument}
concerns: ${t.concerns.join("; ") || "none"}
citations: ${t.citations.join(", ") || "none"}`
    )
    .join("\n\n");
}

export function agentTurnPrompt(input: {
  role: Exclude<BoardAgentRole, "chair">;
  question: string;
  evidenceBrief: string;
  priorTurns: BoardTurn[];
}): string {
  const agent = BOARD_AGENTS[input.role];
  return `You are ${agent.name} on Concierge Advisor, helping the user understand their vault evidence on 0G Compute.
Mandate: ${agent.mandate}

User question / decision:
${input.question}

Agent knowledge (structured facts — trust these over speculation):
${input.evidenceBrief}

Prior board turns:
${formatPriorTurns(input.priorTurns)}

Respond ONLY with valid JSON:
{
  "stance": "approve" | "reject" | "revise" | "abstain",
  "argument": "2-4 sentences of your position",
  "concerns": ["short concern", "..."],
  "citations": ["evidence id or fact key referenced", "..."]
}`;
}

export function chairPrompt(input: {
  question: string;
  evidenceBrief: string;
  turns: BoardTurn[];
}): string {
  const agent = BOARD_AGENTS.chair;
  return `You are ${agent.name} on Concierge Board.
Mandate: ${agent.mandate}

User question / decision:
${input.question}

Vault evidence:
${input.evidenceBrief}

Debate transcript:
${formatPriorTurns(input.turns)}

Respond ONLY with valid JSON:
{
  "verdict": "approve" | "reject" | "revise" | "abstain",
  "summary": "one paragraph consensus",
  "actions": ["next action 1", "next action 2"],
  "dissent": ["unresolved disagreement", "..."],
  "confidence": 0.0
}`;
}

export function fastBoardPrompt(input: {
  question: string;
  evidenceBrief: string;
}): string {
  return `You are Concierge Advisor on 0G Compute — a multi-agent consensus board for vault evidence.
Simulate a debate between Analyst, Risk, and Security agents, then Chair consensus.

Question:
${input.question}

Agent knowledge:
${input.evidenceBrief}

Respond ONLY with valid JSON:
{
  "turns": [
    {
      "role": "analyst" | "risk" | "security",
      "stance": "approve" | "reject" | "revise" | "abstain",
      "argument": "string",
      "concerns": ["string"],
      "citations": ["string"]
    }
  ],
  "consensus": {
    "verdict": "approve" | "reject" | "revise" | "abstain",
    "summary": "string",
    "actions": ["string"],
    "dissent": ["string"],
    "confidence": 0.0
  }
}
Include exactly 3 turns: analyst, then risk, then security.`;
}
