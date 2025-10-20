// app/api/computeInsights/route.ts
import { NextRequest, NextResponse } from "next/server";
import { uploadFileTo0G } from "@/lib/0gStorage";
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";
import { VAULT_ABI } from "@/lib/vaultAbi";
import { ethers } from "ethers";

const VAULT_ADDRESS = process.env.VAULT_ADDRESS!;
const RPC_URL = process.env.GALILEO_RPC_URL!;
const PRIVATE_KEY = process.env.GALILEO_PRIVATE_KEY!;

// --- Terminal color helpers ---
const color = {
  gray: (t: string) => `\x1b[90m${t}\x1b[0m`,
  green: (t: string) => `\x1b[32m${t}\x1b[0m`,
  yellow: (t: string) => `\x1b[33m${t}\x1b[0m`,
  red: (t: string) => `\x1b[31m${t}\x1b[0m`,
  cyan: (t: string) => `\x1b[36m${t}\x1b[0m`,
};

export async function POST(req: NextRequest) {
  const start = Date.now();
  console.log(color.cyan(`\n[REQUEST] computeInsights triggered at ${new Date().toISOString()}`));

  try {
    const { rootHash, fileName, content } = await req.json();
    console.log(color.gray("[BODY]"), { rootHash, fileName, contentLength: content?.length });

    if (!rootHash || !fileName || !content) {
      console.warn(color.yellow("[WARN] Missing parameters"));
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // --- Init signer + broker ---
    console.log(color.cyan("[INIT] Connecting to RPC & initializing broker..."));
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    const broker = await createZGComputeNetworkBroker(signer);
    console.log(color.green("[INIT] Broker initialized successfully"));

    // --- Discover first available model ---
    console.log(color.cyan("[DISCOVER] Listing available 0G services..."));
    const services = await broker.inference.listService();
    if (!services.length) throw new Error("No available 0G Compute services");

    const modelService = services[0];
    console.log(color.green(`[DISCOVER] Selected service: ${modelService.model} | Provider: ${modelService.provider}`));

// --- Acknowledge provider + fetch metadata ---
console.log(color.cyan("[ACK] Acknowledging provider..."));
let endpoint: string;
let model: string;

try {
  // --- Check ledger balance first ---
  const ledger = await broker.ledger.getLedger();
  const total = BigInt(ledger[1]);
  const locked = BigInt(ledger[2]);
  const available = total - locked;
  console.log(color.green(`[LEDGER] Total: ${total} | Locked: ${locked} | Available: ${available}`));

  // Estimate required fee (provider minimum + some buffer)
  const requiredFee = 4_000_437_000_000_000_00n; // adjust based on provider warning or response

  if (available < requiredFee) {
    const topUp = requiredFee - available;
    console.log(color.yellow(`[LEDGER] Insufficient balance, auto-top-up: ${topUp} weiOG`));
    await broker.ledger.depositFund(Number(topUp) / 1e18); // depositFund takes OG in normal units
    console.log(color.green(`[LEDGER] Ledger topped up successfully`));
  }

  // --- Now acknowledge provider ---
  const ackResult = await broker.inference.acknowledgeProviderSigner(modelService.provider);

  if (ackResult && ackResult.hash) {
    console.log(color.green(`[ACK] Provider acknowledged successfully | Tx Hash: ${ackResult.hash}`));
  } else {
    console.log(color.green(`[ACK] Provider acknowledged successfully | Result:`), ackResult);
  }

  // --- Fetch metadata after acknowledge ---
  const metadata = await broker.inference.getServiceMetadata(modelService.provider);
  endpoint = metadata.endpoint;
  model = metadata.model;
  console.log(color.green(`[ACK] Provider metadata fetched | Endpoint: ${endpoint} | Model: ${model}`));

} catch (err: any) {
  console.error(color.red("[ERROR] Provider acknowledgement failed!"));
  console.error(color.red("Error message:"), err.message);
  console.error(color.red("Full error object:"), err);
  throw new Error(`Provider acknowledgement failed: ${err.message}`);
}

    

    // --- Prepare prompt ---
    const prompt = `
You are a service that MUST output valid JSON.
Analyze the uploaded file and respond ONLY with JSON in this exact format:
{ "category": "short label", "summary": "concise summary" }

File Content:
${content}
    `;
    console.log(color.cyan("[PROMPT] Prompt prepared for inference"));

    const headers = await broker.inference.getRequestHeaders(modelService.provider, prompt);

    // --- Send inference request ---
    console.log(color.cyan("[INFER] Sending inference request..."));
    const inferStart = Date.now();
    const response = await fetch(`${endpoint}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt }],
        model,
        response_format: { type: "json_object" },
      }),
    });
    console.log(color.green(`[INFER] Inference request completed in ${Date.now() - inferStart}ms`));

    const raw = await response.text();
    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error(`Service did not return JSON. Body: ${raw.slice(0, 200)}`);
    }

    if (!data.choices?.[0]) throw new Error(`Provider error: ${data.error ?? "No choices returned"}`);
    const aiOutput = data.choices[0].message.content;

    // --- Parse AI output ---
    let category = "unassigned";
    let summary = aiOutput;
    try {
      const parsed = JSON.parse(aiOutput);
      category = parsed.category ?? "unassigned";
      summary = parsed.summary ?? aiOutput;
    } catch {
      console.warn(color.yellow("[WARN] AI output not valid JSON, using raw content"));
    }
    console.log(color.green(`[PARSE] Category: ${category} | Summary length: ${summary.length}`));

    // --- Process response ---
    console.log(color.cyan("[PROCESS] Processing response for internal tracking..."));
    await broker.inference.processResponse(modelService.provider, aiOutput, data.id);
    console.log(color.green("[PROCESS] Response processed successfully"));

    // --- Upload insights ---
    console.log(color.cyan("[UPLOAD] Uploading insights to 0G..."));
    const categoryFile = new File([category], `${fileName}-category.txt`, { type: "text/plain" });
    const summaryFile = new File([summary], `${fileName}-summary.txt`, { type: "text/plain" });

    const uploadStart = Date.now();
    const { rootHash: categoryCID } = await uploadFileTo0G(categoryFile);
    const { rootHash: insightsCID } = await uploadFileTo0G(summaryFile);
    console.log(color.green(`[UPLOAD] Upload completed in ${Date.now() - uploadStart}ms | CategoryCID: ${categoryCID} | InsightsCID: ${insightsCID}`));

    // --- Update Vault contract ---
    console.log(color.cyan("[VAULT] Updating Vault contract with new insights..."));
    const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer);
    const tx = await vault.updateInsights(rootHash, category, insightsCID);
    await tx.wait();
    console.log(color.green("[VAULT] Vault updated successfully"));

    console.log(color.cyan(`[DONE] computeInsights completed in ${Date.now() - start}ms`));
    return NextResponse.json({
      rootHash,
      category,
      insightsCID,
      summary,
      aiRaw: aiOutput,
    });
  } catch (err) {
    console.error(color.red("[FATAL] computeInsights failed:"), err);
    return NextResponse.json(
      { error: (err as Error).message || "Compute failed" },
      { status: 500 }
    );
  }
}
