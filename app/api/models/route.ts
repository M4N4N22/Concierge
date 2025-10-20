// app/api/models/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";
import { ethers } from "ethers";

const RPC_URL = process.env.GALILEO_RPC_URL!;
const PRIVATE_KEY = process.env.GALILEO_PRIVATE_KEY!;

// Helper to safely stringify BigInt values
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
    console.log("[INIT] Connecting to provider...");
    const provider = new ethers.JsonRpcProvider(RPC_URL);

    console.log("[INIT] Creating signer...");
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log("[INIT] Creating compute network broker...");
    const broker = await createZGComputeNetworkBroker(signer);

    console.log("[BROKER] Listing available services...");
    const services = await broker.inference.listService();

    // BigInt-safe logging
    console.log(`[BROKER] Retrieved ${services.length} services.`);
    console.log("[DEBUG] Raw services:", JSON.stringify(bigIntToString(services), null, 2));

    // Map services to frontend-friendly structure
    const models = services.map((s: any, index: number) => {
      console.log(`[SERVICE ${index + 1}] Provider: ${s.provider}, Model: ${s.model}`);
      return {
        provider: s.provider,
        model: s.model,
        verifiability: s.verifiability,
        minUnits: (s.inputPrice + s.outputPrice).toString(), // BigInt → string
      };
    });

    console.log("[RESPONSE] Sending model list to client.");
    return NextResponse.json({ models });
  } catch (err: any) {
    console.error("[ERROR] Failed to fetch models:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch models" },
      { status: 500 }
    );
  }
}
