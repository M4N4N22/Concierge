import { NextResponse } from "next/server";
import {
  AUTO_MODEL_ID,
  getDefaultRouterModel,
  ROUTER_MODEL_CATALOG,
} from "@/lib/computeModels";
import { getOperatorComputeConfig } from "@/lib/computeOperator";

export async function GET() {
  const cfg = getOperatorComputeConfig();

  return NextResponse.json({
    defaultModel: getDefaultRouterModel(),
    autoId: AUTO_MODEL_ID,
    models: ROUTER_MODEL_CATALOG,
    routerConfigured: cfg.routerConfigured,
    subsidized: cfg.subsidized,
  });
}
