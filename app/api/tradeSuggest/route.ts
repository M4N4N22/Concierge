import { NextRequest, NextResponse } from "next/server";
import { authorizeBoardRequest } from "@/lib/boardAuth";
import { runBoardSession } from "@/lib/board/orchestrate";
import { classifyComputeError } from "@/lib/computeErrors";
import { createEvidenceId, type VaultEvidence } from "@/lib/evidence";
import {
  TRADE_SUGGEST_QUESTION,
  suggestionFromBoardText,
  type BalanceSnapshot,
} from "@/lib/trade/suggest";
import { DEFAULT_MANDATE } from "@/lib/trade/types";

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

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    body.question = TRADE_SUGGEST_QUESTION;
    body.mode = typeof body.mode === "string" ? body.mode : "fast";

    const auth = await authorizeBoardRequest(req, body);
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
        chainId:
          typeof body.chainId === "number"
            ? body.chainId
            : Number(body.chainId) || undefined,
      });
    } catch (err) {
      return failCompute(err);
    }

    // Offline vault-board fallback is not a trade suggestion — surface real cause.
    if (session.computeMode === "fallback") {
      const raw =
        session.modelNotes ||
        "0G Compute fell back to offline board (ledger/inference failed)";
      return failCompute(raw);
    }

    const corpus = [
      session.consensus.summary,
      ...session.consensus.actions,
      ...session.turns.map((t) => `${t.stance}: ${t.argument}`),
    ].join("\n");

    const suggestion = suggestionFromBoardText(
      corpus,
      balances,
      { maxNotional },
      session.turns.map((t) => ({
        name: t.name,
        stance: t.stance,
        argument: t.argument,
      })),
      { computeMode: session.computeMode }
    );

    // If parsing collapsed to heuristic because agent prose was unusable, fail instead.
    if (suggestion.source === "heuristic") {
      return failCompute(
        "Agents returned no actionable Buy/Sell/Hold size. Check compute ledger funding and retry."
      );
    }

    return NextResponse.json({
      suggestion,
      sessionId: session.id,
      computeMode: session.computeMode,
    });
  } catch (err) {
    console.error("[tradeSuggest]", err);
    if (
      err instanceof Error &&
      /galileo|ledger|compute|inference|account does not exist/i.test(
        err.message
      )
    ) {
      return failCompute(err);
    }
    return NextResponse.json(
      { error: (err as Error).message || "Suggest failed" },
      { status: 500 }
    );
  }
}
