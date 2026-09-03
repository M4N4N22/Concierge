import { NextResponse } from "next/server";
import { getOperatorComputeConfig } from "@/lib/computeOperator";

export async function GET() {
  const cfg = getOperatorComputeConfig();

  return NextResponse.json({
    backend: cfg.backend,
    subsidized: cfg.subsidized,
    operatorReady: cfg.operatorReady,
    routerConfigured: cfg.routerConfigured,
    directConfigured: cfg.directConfigured,
    freeTierDailyLimit: cfg.freeTierDailyLimit,
    routerModel: cfg.routerConfigured ? cfg.routerModel : undefined,
    privateComputerUrl: cfg.privateComputerUrl,
    copy: cfg.subsidized
      ? "Concierge covers compute for early testers — connect wallet and go."
      : undefined,
  });
}
