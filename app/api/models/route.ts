// app/api/models/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";
import { ethers } from "ethers";

const RPC_URL = process.env.GALILEO_RPC_URL!;
const PRIVATE_KEY = process.env.GALILEO_PRIVATE_KEY!;

export async function GET(req: NextRequest) {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    const broker = await createZGComputeNetworkBroker(signer);

    // List all services
    const services = await broker.inference.listService();

    // Map to useful frontend data
    const models = services.map((s: any) => ({
      provider: s.provider,
      model: s.model,
      verifiability: s.verifiability,
      minUnits: (s.inputPrice + s.outputPrice).toString(), // BigInt as string
    }));

    return NextResponse.json({ models });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed to fetch models" }, { status: 500 });
  }
}
