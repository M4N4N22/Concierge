import { keccak256, stringToHex } from "viem";
import type {
  BoardConsensus,
  BoardSession,
  BoardVerdict,
  GuardSeal,
  GuardStatus,
} from "./types";

const BLOCK_PATTERNS: { re: RegExp; reason: string }[] = [
  {
    re: /unlimited\s*approv|approve\s*\(\s*max|type\(uint256\)\.max|setapprovalforall/i,
    reason: "Unlimited / blanket token approval",
  },
  {
    re: /private\s*key|seed\s*phrase|mnemonic|export\s*key|recovery\s*phrase/i,
    reason: "Requests secret key material",
  },
  {
    re: /drain|transfer\s+all|send\s+all\s+funds|empty\s+wallet|sweep\s+wallet/i,
    reason: "Drain / sweep wallet language",
  },
  {
    re: /blind\s*sign|sign\s+without\s+read|phishing|malicious\s+contract/i,
    reason: "Blind-sign / phishing risk",
  },
  {
    re: /delegatecall|selfdestruct|proxy\s+upgrade\s+to\s+unknown/i,
    reason: "High-risk contract control surface",
  },
];

const REVIEW_PATTERNS: { re: RegExp; reason: string }[] = [
  {
    re: /\b(bridge|swap|stake|lend|borrow|execute|broadcast|submit\s+tx)\b/i,
    reason: "Implies onchain execution — human confirm required",
  },
  {
    re: /\b(approve|permit|allowance)\b/i,
    reason: "Token approval mentioned — review spender",
  },
];

function scanText(text: string): { blocked: string[]; review: string[] } {
  const blocked: string[] = [];
  const review: string[] = [];
  for (const p of BLOCK_PATTERNS) {
    if (p.re.test(text) && !blocked.includes(p.reason)) blocked.push(p.reason);
  }
  for (const p of REVIEW_PATTERNS) {
    if (p.re.test(text) && !review.includes(p.reason)) review.push(p.reason);
  }
  return { blocked, review };
}

function forceVerdict(
  verdict: BoardVerdict,
  status: GuardStatus
): BoardVerdict {
  if (status === "block") return "reject";
  if (status === "review" && verdict === "approve") return "revise";
  return verdict;
}

/** Agentic Firewall: seal chair actions before anything is treated as executable. */
export function sealBoardSession(
  session: BoardSession,
  options?: { agentTokenId?: string; wallet?: string }
): BoardSession {
  const corpus = [
    session.question,
    session.consensus.summary,
    ...session.consensus.actions,
    ...session.turns.map((t) => t.argument),
  ].join("\n");

  const { blocked: corpusBlocked, review: corpusReview } = scanText(corpus);

  const allowedActions: string[] = [];
  const blockedActions: string[] = [];
  const reasons = [...corpusBlocked];

  for (const action of session.consensus.actions) {
    const hit = scanText(action);
    if (hit.blocked.length || corpusBlocked.length) {
      blockedActions.push(action);
      hit.blocked.forEach((r) => {
        if (!reasons.includes(r)) reasons.push(r);
      });
    } else {
      allowedActions.push(action);
      hit.review.forEach((r) => {
        if (!reasons.includes(r)) reasons.push(r);
      });
    }
  }

  let status: GuardStatus = "pass";
  if (corpusBlocked.length || blockedActions.length) status = "block";
  else if (corpusReview.length || session.consensus.verdict === "approve") {
    status = "review";
    corpusReview.forEach((r) => {
      if (!reasons.includes(r)) reasons.push(r);
    });
    if (session.consensus.verdict === "approve") {
      reasons.push("Approve verdict requires explicit human confirmation");
    }
  }

  if (status === "pass" && !reasons.length) {
    reasons.push("No drain / unlimited-approval patterns detected");
  }

  const sealPayload = {
    sessionId: session.id,
    verdict: session.consensus.verdict,
    allowedActions,
    blockedActions,
    status,
    agentTokenId: options?.agentTokenId ?? null,
    wallet: options?.wallet ?? null,
    evidenceIds: session.evidenceIds,
  };

  const sealHash = keccak256(stringToHex(JSON.stringify(sealPayload)));

  const consensus: BoardConsensus = {
    ...session.consensus,
    verdict: forceVerdict(session.consensus.verdict, status),
    actions: status === "block" ? allowedActions : session.consensus.actions,
  };

  const guard: GuardSeal = {
    status,
    sealed: true,
    allowedActions,
    blockedActions,
    reasons,
    sealHash,
    sealedAt: new Date().toISOString(),
  };

  return {
    ...session,
    consensus,
    guard,
    agentTokenId: options?.agentTokenId ?? session.agentTokenId,
    chairWallet: options?.wallet ?? session.chairWallet,
  };
}
