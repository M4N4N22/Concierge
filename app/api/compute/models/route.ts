import { NextResponse } from "next/server";
import {
  ROUTER_MODEL_CATALOG,
  companySortIndex,
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
      const costRank = new Map(chat.map((m, i) => [m.id, i]));
      models = chat
        .map((m, i) => ({
          id: m.id,
          label: m.name,
          description: i === 0 ? "Cheapest" : undefined,
          company: m.company,
          type: m.type || "chatbot",
          formats: m.formats,
          preferredFormat: m.preferredFormat,
        }))
        .sort((a, b) => {
          const byCompany =
            companySortIndex(a.company) - companySortIndex(b.company);
          if (byCompany !== 0) return byCompany;
          return (costRank.get(a.id) ?? 0) - (costRank.get(b.id) ?? 0);
        });
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
