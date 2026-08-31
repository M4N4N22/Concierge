// app/api/ledger/route.ts
import { NextRequest, NextResponse } from "next/server";
import { MIN_LEDGER_CREATE_OG, MIN_PROVIDER_FUND_OG } from "@/lib/computeConstants";
import {
  createComputeBroker,
  parseComputeChainId,
} from "@/lib/computeBroker";
import { ethers } from "ethers";

const color = {
  gray: (t: string) => `\x1b[90m${t}\x1b[0m`,
  green: (t: string) => `\x1b[32m${t}\x1b[0m`,
  yellow: (t: string) => `\x1b[33m${t}\x1b[0m`,
  red: (t: string) => `\x1b[31m${t}\x1b[0m`,
  cyan: (t: string) => `\x1b[36m${t}\x1b[0m`,
};

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

function logLedgerSummary(ledger: any) {
  if (!ledger) return;
  const [owner, total, locked] = ledger;
  console.log(
    color.green(`[LEDGER] Owner:`),
    owner,
    color.cyan(`| Total:`),
    total,
    color.yellow(`| Locked:`),
    locked
  );
}

export async function POST(req: NextRequest) {
  const start = Date.now();
  console.log(
    color.cyan(
      `\n[REQUEST] Ledger API triggered at ${new Date().toISOString()}`
    )
  );

  try {
    const body = await req.json();
    console.log(color.gray(`[BODY]`), body);

    const { action, amount, subAccount } = body;
    const requestChainId = parseComputeChainId(body.chainId);
    if (!action) {
      console.warn(color.yellow(`[WARN] Missing action field`));
      return NextResponse.json({ error: "Missing action" }, { status: 400 });
    }

    console.log(
      color.cyan(
        `[INIT] Connecting broker (chainId=${requestChainId ?? "default"})...`
      )
    );
    const { broker, signer, provider, cfg } =
      await createComputeBroker(requestChainId);
    console.log(
      color.green(
        `[INIT] Broker ready on ${cfg.networkName} (${cfg.chainId}) ${signer.address}`
      )
    );

    const nativeWei = await provider.getBalance(signer.address);
    const nativeBalanceOg = Number(ethers.formatEther(nativeWei));
    const brokerInfo = {
      address: signer.address,
      chainId: cfg.chainId,
      network: cfg.networkName,
      isTestnet: cfg.isTestnet,
      nativeBalanceOg,
      requiredCreateOg: MIN_LEDGER_CREATE_OG,
      shortfallOg: Math.max(0, MIN_LEDGER_CREATE_OG - nativeBalanceOg),
      canCreateLedger: nativeBalanceOg >= MIN_LEDGER_CREATE_OG,
    };

    switch (action) {
      case "check": {
        console.log(color.cyan(`[ACTION] Checking ledger existence...`));
        try {
          const ledger = await broker.ledger.getLedger();
          logLedgerSummary(ledger);
          console.log(color.green(`[SUCCESS] Ledger fetched successfully`));
          return NextResponse.json({
            exists: true,
            ledger: bigIntToString(ledger),
            broker: brokerInfo,
          });
        } catch (err: any) {
          const msg = `${err?.shortMessage || ""} ${err?.message || ""}`;
          if (
            msg.includes("LedgerNotExists") ||
            /account does not exist|add-account/i.test(msg)
          ) {
            console.warn(color.yellow(`[WARN] Ledger does not exist`));
            return NextResponse.json({ exists: false, broker: brokerInfo });
          }
          console.error(color.red(`[ERROR] Failed to fetch ledger:`), err);
          throw err;
        }
      }

      case "create": {
        console.log(color.cyan(`[ACTION] Creating new ledger...`));
        const createAmount = amount ?? MIN_LEDGER_CREATE_OG;
        if (createAmount < MIN_LEDGER_CREATE_OG) {
          return NextResponse.json(
            {
              error: `Minimum balance to create a ledger is ${MIN_LEDGER_CREATE_OG} OG. Use broker.ledger.addLedger(${MIN_LEDGER_CREATE_OG}).`,
            },
            { status: 400 }
          );
        }
        await broker.ledger.addLedger(createAmount);
        const newLedger = await broker.ledger.getLedger();
        logLedgerSummary(newLedger);
        console.log(color.green(`[SUCCESS] Ledger created successfully`));
        return NextResponse.json({
          created: true,
          ledger: bigIntToString(newLedger),
          broker: brokerInfo,
        });
      }

      case "deposit": {
        console.log(color.cyan(`[ACTION] Depositing to ledger...`));
        if (!amount)
          return NextResponse.json(
            { error: "Missing amount" },
            { status: 400 }
          );
        await broker.ledger.depositFund(amount);
        const updatedLedger = await broker.ledger.getLedger();
        logLedgerSummary(updatedLedger);
        console.log(color.green(`[SUCCESS] Deposit successful`));
        return NextResponse.json({
          deposited: true,
          ledger: bigIntToString(updatedLedger),
          broker: brokerInfo,
        });
      }

      case "fundSubAccount": {
        console.log(color.cyan(`[ACTION] Funding sub-account: ${subAccount}`));
        if (!subAccount || !amount) {
          return NextResponse.json(
            { error: "Missing subAccount or amount" },
            { status: 400 }
          );
        }
        if (amount < MIN_PROVIDER_FUND_OG) {
          return NextResponse.json(
            {
              error: `Minimum ${MIN_PROVIDER_FUND_OG} OG required per provider sub-account.`,
            },
            { status: 400 }
          );
        }

        try {
          const ledgerBefore = await broker.ledger.getLedger();
          const available = ledgerBefore[1] - ledgerBefore[2];
          console.log(
            color.gray(`[LEDGER BEFORE] Available:`),
            available.toString()
          );

          const amountBigInt = BigInt(Math.round(amount * 1e18));
          if (amountBigInt > available) {
            console.warn(
              color.yellow(
                `[WARN] Insufficient balance for sub-account transfer`
              )
            );
            return NextResponse.json(
              { error: "Insufficient available balance" },
              { status: 400 }
            );
          }

          await broker.ledger.transferFund(subAccount, amountBigInt);
          const ledgerAfter = await broker.ledger.getLedger();
          logLedgerSummary(ledgerAfter);
          console.log(
            color.green(`[SUCCESS] Sub-account funded successfully`)
          );

          return NextResponse.json({
            funded: true,
            subAccount,
            amount,
            ledger: bigIntToString(ledgerAfter),
            broker: brokerInfo,
          });
        } catch (err) {
          console.error(color.red(`[ERROR] Sub-account funding failed:`), err);
          return NextResponse.json(
            { error: (err as Error).message || "Transfer failed" },
            { status: 500 }
          );
        }
      }

      default:
        console.warn(color.yellow(`[WARN] Invalid action provided`));
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (err) {
    console.error(color.red(`[FATAL] Ledger route failed:`), err);
    return NextResponse.json(
      { error: (err as Error).message || "Ledger operation failed" },
      { status: 500 }
    );
  } finally {
    console.log(
      color.gray(`[DONE] Ledger API completed in ${Date.now() - start}ms`)
    );
  }
}
