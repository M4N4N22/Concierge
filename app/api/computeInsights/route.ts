// app/api/computeInsights/route.ts
import { NextRequest, NextResponse } from "next/server";
import { uploadFileTo0G } from "@/lib/0gStorage";
import { hexZeroPad } from "@/lib/helpers";
import { uploadFileSafe } from "@/utils/upload";
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";
import { VAULT_ABI } from "@/lib/vaultAbi";
import { ethers } from "ethers";

const VAULT_ADDRESS = process.env.VAULT_ADDRESS!;
const RPC_URL = process.env.GALILEO_RPC_URL!;
const PRIVATE_KEY = process.env.GALILEO_PRIVATE_KEY!;

// --- Constants ---
const MICRO_UNIT = 100_000_000_000_000n; // 1 micro-unit = 1e12 weiOG
const MIN_FEE_UNITS = 6000n; // minimal provider fee in units
const MIN_DEPOSIT_OG = 0.1;

export async function POST(req: NextRequest) {
  try {
    const { rootHash, fileName, content } = await req.json();
    if (!rootHash || !fileName || !content) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    // --- Init signer + broker ---
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    const broker = await createZGComputeNetworkBroker(signer);

    // --- Ensure broker account + funds ---
    let ledger;
    try {
      ledger = await broker.ledger.getLedger();
      console.log("Ledger found:", ledger);
    } catch (err: any) {
      if (err?.shortMessage?.includes("LedgerNotExists")) {
        console.log("Ledger not found → creating with 0.1 OG...");
        await broker.ledger.addLedger(0.1);
        ledger = await broker.ledger.getLedger();
      } else {
        throw err;
      }
    }
    console.log("Ledger raw:", ledger);

    // Fixed balance calculation section in your computeInsights route

    let totalWeiOG = ledger[1] ?? 0n;
    let lockedWeiOG = ledger[2] ?? 0n;

    console.log(`Debug: totalWeiOG=${totalWeiOG}, lockedWeiOG=${lockedWeiOG}`);

    // Fix: Handle the case where locked > total (shouldn't happen but does)
    let availableWeiOG: bigint;
    if (totalWeiOG >= lockedWeiOG) {
      availableWeiOG = totalWeiOG - lockedWeiOG;
    } else {
      console.warn(
        `Warning: Locked (${lockedWeiOG}) > Total (${totalWeiOG}). Using total as available.`
      );
      availableWeiOG = totalWeiOG;
    }

    let availableUnits = availableWeiOG / MICRO_UNIT;

    console.log(
      `Available: ${availableUnits} units (${Number(availableWeiOG) / 1e18} OG)`
    );

    // Increase minimum required units to account for actual service costs
    const REQUIRED_UNITS = 8000n; // Increased from 6000n

    if (availableUnits < REQUIRED_UNITS) {
      // More aggressive deposit calculation
      const requiredWeiOG = REQUIRED_UNITS * MICRO_UNIT;
      const shortfallWeiOG =
        requiredWeiOG > availableWeiOG ? requiredWeiOG - availableWeiOG : 0n;
      const depositOG = Math.max(
        0.2, // Increased minimum deposit
        Number(shortfallWeiOG) / 1e18 + 0.1 // Add more buffer
      );

      console.log(
        `Balance insufficient (${availableUnits} units) → depositing ${depositOG} OG...`
      );

      try {
        await broker.ledger.depositFund(depositOG);

        // Wait a moment for the deposit to process
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Refresh ledger after deposit
        ledger = await broker.ledger.getLedger();
        totalWeiOG = ledger[1] ?? 0n;
        lockedWeiOG = ledger[2] ?? 0n;

        // Recalculate with same logic
        if (totalWeiOG >= lockedWeiOG) {
          availableWeiOG = totalWeiOG - lockedWeiOG;
        } else {
          console.warn(
            `Post-deposit: Locked (${lockedWeiOG}) > Total (${totalWeiOG})`
          );
          availableWeiOG = totalWeiOG;
        }

        availableUnits = availableWeiOG / MICRO_UNIT;
        const totalOG = Number(totalWeiOG) / 1e18;

        console.log(
          `Ledger updated. Total = ${totalOG} OG, available = ${availableUnits} units`
        );

        // Final check
        if (availableUnits < REQUIRED_UNITS) {
          throw new Error(
            `Still insufficient balance after deposit: ${availableUnits} units < ${REQUIRED_UNITS} required`
          );
        }
      } catch (depositError) {
        console.error("Deposit failed:", depositError);
        throw new Error(`Failed to deposit funds: ${depositError}`);
      }
    } else {
      const totalOG = Number(totalWeiOG) / 1e18;
      console.log(
        `Ledger sufficient: ${availableUnits} units / ${totalOG} OG total`
      );
    }

    // --- Discover available services ---
    const services = await broker.inference.listService();
    const llamaService = services.find((s: any) =>
      s.model.includes("llama-3.3-70b-instruct")
    );
    if (!llamaService) throw new Error("llama-3.3-70b-instruct not available");

    // --- Acknowledge provider ---
    await broker.inference.acknowledgeProviderSigner(llamaService.provider);

    const { endpoint, model } = await broker.inference.getServiceMetadata(
      llamaService.provider
    );

    // --- Prepare AI prompt ---
    const question = `
    You are a service that MUST output valid JSON.
    Analyze the uploaded file and respond ONLY with JSON in this exact format:
    
    {
      "category": "short label",
      "summary": "concise summary"
    }
    
    Do not include any explanation or extra text outside the JSON.
    
    File Content:
    ${content}    
    `;

    const headers = await broker.inference.getRequestHeaders(
      llamaService.provider,
      question
    );

    // --- Send inference request with fallbackFee ---
    const response = await fetch(`${endpoint}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({
        messages: [{ role: "user", content: question }],
        model,
        response_format: { type: "json_object" },
        fallbackFee: 0.01,
      }),
    });

    const raw = await response.text();
    console.log("Raw service response:", raw.slice(0, 300));

    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error(
        `Service did not return JSON (status ${
          response.status
        }). Body: ${raw.slice(0, 200)}`
      );
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

    // --- Verify response ---
    await broker.inference.processResponse(
      llamaService.provider,
      aiOutput,
      data.id
    );

    // --- Upload AI insights ---
    // Upload category
    const categoryFile = new File([category], `${fileName}-category.txt`, {
      type: "text/plain",
    });

    // Upload summary
    const summaryFile = new File([summary], `${fileName}-summary.txt`, {
      type: "text/plain",
    });

    // Upload both files safely
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
      summary, // keep summary only for frontend display
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
