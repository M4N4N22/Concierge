import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";
import { peekWalletWeeklyQuotas } from "@/lib/computeUsage";
import { getOperatorComputeConfig } from "@/lib/computeOperator";

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet")?.trim() ?? "";
  const cfg = getOperatorComputeConfig();

  if (!wallet || !isAddress(wallet)) {
    return NextResponse.json({
      subsidized: cfg.subsidized,
      operatorReady: cfg.operatorReady,
      freeTierChatWeeklyLimit: cfg.freeTierChatWeeklyLimit,
      freeTierFeedWeeklyLimit: cfg.freeTierFeedWeeklyLimit,
      quotas: null,
    });
  }

  const quotas = peekWalletWeeklyQuotas(wallet);
  return NextResponse.json({
    subsidized: cfg.subsidized,
    operatorReady: cfg.operatorReady,
    freeTierChatWeeklyLimit: cfg.freeTierChatWeeklyLimit,
    freeTierFeedWeeklyLimit: cfg.freeTierFeedWeeklyLimit,
    quotas,
  });
}
