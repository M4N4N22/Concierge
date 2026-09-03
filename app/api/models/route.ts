import { NextRequest, NextResponse } from "next/server";
import {
  createComputeBroker,
  parseComputeChainId,
} from "@/lib/computeBroker";
import { withTtlCache } from "@/lib/ttlCache";
import { COMPUTE_CACHE_TTL, modelsCacheKey } from "@/lib/computeCacheKeys";

function bigIntToString(obj: unknown): unknown {
  if (typeof obj === "bigint") return obj.toString();
  if (Array.isArray(obj)) return obj.map(bigIntToString);
  if (obj && typeof obj === "object") {
    const res: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) res[k] = bigIntToString(v);
    return res;
  }
  return obj;
}

export async function GET(req: NextRequest) {
  try {
    const chainId = parseComputeChainId(
      req.nextUrl.searchParams.get("chainId")
    );
    const payload = await withTtlCache(
      modelsCacheKey(chainId),
      COMPUTE_CACHE_TTL.modelsBroker,
      async () => {
        const { broker, cfg } = await createComputeBroker(chainId);
        const services = await broker.inference.listService();
        const models = services.map((s: {
          provider: string;
          model: string;
          verifiability: string;
          inputPrice: bigint;
          outputPrice: bigint;
        }) => ({
          provider: s.provider,
          model: s.model,
          verifiability: s.verifiability,
          minUnits: (s.inputPrice + s.outputPrice).toString(),
        }));
        return {
          models: bigIntToString(models),
          network: cfg.networkName,
          chainId: cfg.chainId,
          isTestnet: cfg.isTestnet,
        };
      }
    );

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "private, max-age=30, stale-while-revalidate=90",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch models";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
