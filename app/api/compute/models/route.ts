import { NextResponse } from "next/server";
import {
  ROUTER_MODEL_CATALOG,
  type ComputeModelOption,
} from "@/lib/computeModels";
import { getOperatorComputeConfig } from "@/lib/computeOperator";
import { listLiveChatModels } from "@/lib/computeRouterModels";

export async function GET() {
  const cfg = getOperatorComputeConfig();
  let defaultModel = cfg.routerModel;
  let models: ComputeModelOption[] = ROUTER_MODEL_CATALOG;

  try {
    const chat = await listLiveChatModels();
    if (chat.length) {
      models = chat.map((m, i) => ({
        id: m.id,
        label: m.name,
        description: i === 0 ? "Cheapest" : undefined,
      }));
      defaultModel = chat[0].id;
    }
  } catch {
    /* keep static catalog */
  }

  return NextResponse.json(
    {
      defaultModel,
      models,
      routerConfigured: cfg.routerConfigured,
      subsidized: cfg.subsidized,
    },
    {
      headers: {
        "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
      },
    }
  );
}
