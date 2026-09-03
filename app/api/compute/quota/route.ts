import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";
import { peekWalletDailyQuota } from "@/lib/computeUsage";
import { getOperatorComputeConfig } from "@/lib/computeOperator";

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet")?.trim() ?? "";
  const cfg = getOperatorComputeConfig();

  if (!wallet || !isAddress(wallet)) {
    return NextResponse.json({
      subsidized: cfg.subsidized,
      operatorReady: cfg.operatorReady,
      freeTierDailyLimit: cfg.freeTierDailyLimit,
      quota: null,
    });
  }

  const quota = peekWalletDailyQuota(wallet);
  return NextResponse.json({
    subsidized: cfg.subsidized,
    operatorReady: cfg.operatorReady,
    freeTierDailyLimit: cfg.freeTierDailyLimit,
    quota,
  });
}
