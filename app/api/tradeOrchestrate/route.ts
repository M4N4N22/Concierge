import { NextRequest, NextResponse } from "next/server";
import { authorizeTradeRequest } from "@/lib/trade/watcherAuth";
import { runBoardSession } from "@/lib/board/orchestrate";
import { sealBoardSession } from "@/lib/board/guard";
import { classifyComputeError } from "@/lib/computeErrors";
import { createEvidenceId, type VaultEvidence } from "@/lib/evidence";
import {
  TRADE_SUGGEST_QUESTION,
  suggestionFromBoardText,
  type BalanceSnapshot,
} from "@/lib/trade/suggest";
import { proposeTradeFromBoard } from "@/lib/trade/propose";
import { orchestrateTradeDecision } from "@/lib/trade/orchestrator";
import { buildTradeMemoryRecord, serializeTradeMemory } from "@/lib/trade/memory";
import { DEFAULT_MANDATE, type TradeMandate } from "@/lib/trade/types";

export const maxDuration = 90;

function parseBalances(raw: unknown): BalanceSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  const og = Number(b.og);
  const usdc = Number(b.usdc);
  const weth = Number(b.weth ?? 0);
  if (![og, usdc, weth].every((n) => Number.isFinite(n) && n >= 0)) return null;
  return { og, usdc, weth };
}

function parseMandate(raw: unknown, maxNotional: number): TradeMandate {
  const base = { ...DEFAULT_MANDATE, maxNotional, updatedAt: new Date().toISOString() };
  if (!raw || typeof raw !== "object") return base;
  const m = raw as Record<string, unknown>;
  return {
    ...base,
    maxNotional:
      typeof m.maxNotional === "number" && m.maxNotional > 0
        ? m.maxNotional
        : maxNotional,
    maxSlippageBps:
      typeof m.maxSlippageBps === "number" ? m.maxSlippageBps : base.maxSlippageBps,
    requireConfirm:
      typeof m.requireConfirm === "boolean" ? m.requireConfirm : base.requireConfirm,
    autonomous:
      typeof m.autonomous === "boolean" ? m.autonomous : base.autonomous,
    allowlist: Array.isArray(m.allowlist)
      ? m.allowlist.map(String)
      : base.allowlist,
  };
}

function failCompute(raw: unknown, status = 503) {
  const classified = classifyComputeError(raw);
  return NextResponse.json(
    {
      error: classified.message,
      code: classified.code,
      title: classified.title,
      action: classified.action,
      detail: classified.raw,
    },
    { status }
  );
}

/**
 * Full trade orchestration: 0G Compute agents → consensus → gatekeeper → memory blob.
 * Foundation for Cannes-style autonomous desk (Shawarma / Croisette / Orchestra patterns).
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    body.question = TRADE_SUGGEST_QUESTION;
    body.mode = typeof body.mode === "string" ? body.mode : "fast";

    const auth = await authorizeTradeRequest(req, body);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const balances = parseBalances(body.balances);
    if (!balances) {
      return NextResponse.json(
        { error: "balances: { og, usdc, weth } required" },
        { status: 400 }
      );
    }

    const maxNotional =
      typeof body.maxNotional === "number" && body.maxNotional > 0
        ? body.maxNotional
        : DEFAULT_MANDATE.maxNotional;
    const mandate = parseMandate(body.mandate, maxNotional);
    const chainId =
      typeof body.chainId === "number"
        ? body.chainId
        : Number(body.chainId) || undefined;
    const agentTokenId =
      typeof body.agentTokenId === "string" ? body.agentTokenId : undefined;

    const evidence: VaultEvidence = {
      schemaVersion: 1,
      id: createEvidenceId("wallet"),
      type: "wallet",
      source: "wallet",
      title: "Connected wallet balances",
      summary: `OG ${balances.og}, USDC ${balances.usdc}, WETH ${balances.weth}`,
      facts: [
        { key: "og_balance", value: balances.og, unit: "OG" },
        { key: "usdc_balance", value: balances.usdc, unit: "USDC" },
        { key: "weth_balance", value: balances.weth, unit: "WETH" },
        { key: "max_notional_usdc", value: maxNotional, unit: "USDC" },
        { key: "pair", value: "OG/USDC" },
      ],
      wallet: auth.wallet,
      createdAt: new Date().toISOString(),
      confidence: 0.9,
    };

    let session;
    try {
      session = await runBoardSession({
        question: TRADE_SUGGEST_QUESTION,
        evidence: [evidence],
        mode: auth.mode === "live" ? "live" : "fast",
        wallet: auth.wallet,
        chainId,
      });
    } catch (err) {
      return failCompute(err);
    }

    if (session.computeMode === "fallback") {
      return failCompute(
        session.modelNotes ||
          "0G Compute fell back to offline board (ledger/inference failed)"
      );
    }

    session = sealBoardSession(session, {
      agentTokenId,
      wallet: auth.wallet,
    });

    const corpus = [
      session.consensus.summary,
      ...session.consensus.actions,
      ...session.turns.map((t) => `${t.stance}: ${t.argument}`),
    ].join("\n");

    const suggestion = suggestionFromBoardText(
      corpus,
      balances,
      { maxNotional: mandate.maxNotional },
      session.turns.map((t) => ({
        name: t.name,
        stance: t.stance,
        argument: t.argument,
      })),
      { computeMode: session.computeMode }
    );

    const proposal = proposeTradeFromBoard(session, mandate);
    const orchestration = orchestrateTradeDecision({
      session,
      suggestion,
      proposal,
      mandate,
      threshold:
        typeof body.consensusThreshold === "number"
          ? body.consensusThreshold
          : undefined,
    });

    const memory = buildTradeMemoryRecord({
      sessionId: session.id,
      proposal,
      consensus: orchestration.consensus,
      gate: orchestration.gate,
      rationale: suggestion.rationale,
      wallet: auth.wallet,
      chainId,
      agentTokenId,
    });

    return NextResponse.json({
      orchestration: {
        gate: orchestration.gate,
        reasons: orchestration.reasons,
        consensus: orchestration.consensus,
        proposal: orchestration.proposal,
        suggestion: orchestration.suggestion,
        sessionId: orchestration.sessionId,
        computeMode: orchestration.computeMode,
        guardStatus: orchestration.guardStatus,
      },
      memory: {
        record: memory,
        serialized: serializeTradeMemory(memory),
      },
    });
  } catch (err) {
    console.error("[tradeOrchestrate]", err);
    if (
      err instanceof Error &&
      /galileo|ledger|compute|inference|account does not exist/i.test(
        err.message
      )
    ) {
      return failCompute(err);
    }
    return NextResponse.json(
      { error: (err as Error).message || "Orchestration failed" },
      { status: 500 }
    );
  }
}
