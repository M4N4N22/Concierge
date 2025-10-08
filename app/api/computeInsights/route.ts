// app/api/computeInsights/route.ts
import { NextRequest, NextResponse } from "next/server";
import { uploadFileTo0G } from "@/lib/0gStorage";
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";
import { VAULT_ABI } from "@/lib/vaultAbi";
import { ethers } from "ethers";

const VAULT_ADDRESS = process.env.VAULT_ADDRESS!;
const RPC_URL = process.env.GALILEO_RPC_URL!;
const PRIVATE_KEY = process.env.GALILEO_PRIVATE_KEY!;

// --- Constants ---
const MICRO_UNIT = 100_000_000_000_000n; // 1 micro-unit = 1e12 weiOG
const REQUIRED_UNITS = 8000n;

export async function POST(req: NextRequest) {
  try {
    const { rootHash, fileName, content } = await req.json();
    if (!rootHash || !fileName || !content) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // --- Init signer + broker ---
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    const broker = await createZGComputeNetworkBroker(signer);

    // --- Discover available services ---
    const services = await broker.inference.listService();
    const modelService = services.find((s: any) => s.model.includes("llama-3.3-70b-instruct"));
    if (!modelService) throw new Error("Required model not available");

    // --- Acknowledge provider and get metadata ---
    await broker.inference.acknowledgeProviderSigner(modelService.provider);
    const { endpoint, model } = await broker.inference.getServiceMetadata(modelService.provider);

    // --- Prepare AI prompt ---
    const prompt = `
    You are a service that MUST output valid JSON.
    Analyze the uploaded file and respond ONLY with JSON in this exact format:
    { "category": "short label", "summary": "concise summary" }
    
    File Content:
    ${content}    
    `;

    const headers = await broker.inference.getRequestHeaders(modelService.provider, prompt);

    // --- Send inference request ---
    const response = await fetch(`${endpoint}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt }],
        model,
        response_format: { type: "json_object" },
        fallbackFee: 0.01, // fee in OG
      }),
    });

    const raw = await response.text();
    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error(`Service did not return JSON. Body: ${raw.slice(0, 200)}`);
    }

    if (!data.choices || !data.choices[0]) {
      throw new Error(`Provider error: ${data.error ?? "No choices returned"}`);
    }

    const aiOutput = data.choices[0].message.content;
    let category = "unassigned";
    let summary = aiOutput;

    try {
      const parsed = JSON.parse(aiOutput);
      category = parsed.category ?? "unassigned";
      summary = parsed.summary ?? aiOutput;
    } catch {
      // fallback if not valid JSON
    }

    // --- Process response & verify ---
    await broker.inference.processResponse(modelService.provider, aiOutput, data.id);

    // --- Upload insights ---
    const categoryFile = new File([category], `${fileName}-category.txt`, { type: "text/plain" });
    const summaryFile = new File([summary], `${fileName}-summary.txt`, { type: "text/plain" });

    const { rootHash: categoryCID } = await uploadFileTo0G(categoryFile);
    const { rootHash: insightsCID } = await uploadFileTo0G(summaryFile);

    // --- Update Vault contract ---
    const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer);
    const tx = await vault.updateInsights(rootHash, category, insightsCID);
    await tx.wait();

    return NextResponse.json({
      rootHash,
      category,
      insightsCID,
      summary,
      aiRaw: aiOutput,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: (err as Error).message || "Compute failed" },
      { status: 500 }
    );
  }
}
