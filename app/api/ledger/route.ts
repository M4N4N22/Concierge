// app/api/ledger/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";
import { ethers } from "ethers";

const RPC_URL = process.env.GALILEO_RPC_URL!;
const PRIVATE_KEY = process.env.GALILEO_PRIVATE_KEY!;

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Request body:", body);

    const { action, amount, subAccount } = body;
    if (!action) {
      return NextResponse.json({ error: "Missing action" }, { status: 400 });
    }

    // Initialize provider + signer + broker
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    const broker = await createZGComputeNetworkBroker(signer);

    console.log(Object.keys(broker.ledger));

    switch (action) {
      case "check":
        try {
          const ledger = await broker.ledger.getLedger();
          console.log("Ledger found:", ledger);
          return NextResponse.json({
            exists: true,
            ledger: bigIntToString(ledger),
          });
        } catch (err: any) {
          console.error("Error fetching ledger:", err);
          if (err?.shortMessage?.includes("LedgerNotExists")) {
            return NextResponse.json({ exists: false });
          }
          throw err;
        }

      case "create":
        await broker.ledger.addLedger(amount ?? 0.1);
        const newLedger = await broker.ledger.getLedger();
        console.log("New ledger created:", newLedger);
        return NextResponse.json({
          created: true,
          ledger: bigIntToString(newLedger),
        });

      case "deposit":
        if (!amount)
          return NextResponse.json(
            { error: "Missing amount" },
            { status: 400 }
          );
        await broker.ledger.depositFund(amount);
        const updatedLedger = await broker.ledger.getLedger();
        console.log("Ledger after deposit:", updatedLedger);
        return NextResponse.json({
          deposited: true,
          ledger: bigIntToString(updatedLedger),
        });

      case "fundSubAccount":
        if (!subAccount || !amount) {
          return NextResponse.json(
            { error: "Missing subAccount or amount" },
            { status: 400 }
          );
        }

        try {
          const ledgerBefore = await broker.ledger.getLedger();
          console.log(broker.ledger.transferFund.toString());

          console.log("Ledger before sub-account funding:", ledgerBefore);

          const available = ledgerBefore[1] - ledgerBefore[2]; // total - locked
          console.log("Available OG:", available.toString());

          if (BigInt(Math.round(amount * 1e18)) > available) {
            return NextResponse.json(
              {
                error: "Insufficient available balance to fund sub-account",
              },
              { status: 400 }
            );
          }

          const amountBigInt = BigInt(Math.round(amount * 1e18));
          await broker.ledger.transferFund(subAccount, amountBigInt);

          const ledgerAfter = await broker.ledger.getLedger();
          console.log("Ledger after sub-account funding:", ledgerAfter);

          return NextResponse.json({
            funded: true,
            subAccount,
            amount,
            ledger: bigIntToString(ledgerAfter),
          });
        } catch (err) {
          console.error("Sub-account funding failed:", err);
          return NextResponse.json(
            { error: (err as Error).message || "Transfer failed" },
            { status: 500 }
          );
        }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (err) {
    console.error("Ledger route failed:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Ledger operation failed" },
      { status: 500 }
    );
  }
}
