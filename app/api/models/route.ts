// app/api/models/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  createComputeBroker,
  parseComputeChainId,
} from "@/lib/computeBroker";

function bigIntToString(obj: any): any {
  if (typeof obj === "bigint") return obj.toString();
  if (Array.isArray(obj)) return obj.map(bigIntToString);
  if (obj && typeof obj === "object") {
    const res: any = {};
    for (const [k, v] of Object.entries(obj)) res[k] = bigIntToString(v);
    return res;
  }
  return obj;
}

export async function GET(req: NextRequest) {
  console.log("[GET /api/models] Request received");

  try {
    const chainId = parseComputeChainId(
      req.nextUrl.searchParams.get("chainId")
    );
    console.log(`[INIT] Creating compute broker (chainId=${chainId ?? "default"})...`);
    const { broker, cfg } = await createComputeBroker(chainId);
    console.log(`[INIT] Broker on ${cfg.networkName}`);

    console.log("[BROKER] Listing available services...");
    const services = await broker.inference.listService();

    console.log(`[BROKER] Retrieved ${services.length} services.`);
    console.log("[DEBUG] Raw services:", JSON.stringify(bigIntToString(services), null, 2));

    const models = services.map((s: any, index: number) => {
      console.log(`[SERVICE ${index + 1}] Provider: ${s.provider}, Model: ${s.model}`);
      return {
        provider: s.provider,
        model: s.model,
        verifiability: s.verifiability,
        minUnits: (s.inputPrice + s.outputPrice).toString(),
      };
    });

    console.log("[RESPONSE] Sending model list to client.");
    return NextResponse.json({
      models,
      network: cfg.networkName,
      chainId: cfg.chainId,
      isTestnet: cfg.isTestnet,
    });
  } catch (err: any) {
    console.error("[ERROR] Failed to fetch models:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch models" },
      { status: 500 }
    );
  }
}
