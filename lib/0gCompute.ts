import { createZGComputeNetworkBroker } from "@0gfoundation/0g-compute-ts-sdk";
import { ethers } from "ethers";
import { resolveComputeBrokerConfig } from "@/lib/computeBroker";

async function getBroker(chainId?: number | null) {
  const cfg = resolveComputeBrokerConfig(chainId);
  const provider = new ethers.JsonRpcProvider(cfg.rpcUrl);
  const signer = new ethers.Wallet(cfg.privateKey, provider);
  return {
    broker: await createZGComputeNetworkBroker(signer),
    cfg,
  };
}

/** Run a prompt through 0G Compute on the selected chain (mainnet or Galileo). */
export async function run0GInference(
  prompt: string,
  chainId?: number | null
): Promise<string> {
  const { broker } = await getBroker(chainId);

  const services = await broker.inference.listService();
  if (!services.length) throw new Error("No available 0G Compute services");

  const modelService = services[0];

  let ledger: Awaited<ReturnType<typeof broker.ledger.getLedger>>;
  try {
    ledger = await broker.ledger.getLedger();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/account does not exist|create an account|add-account/i.test(msg)) {
      throw new Error(
        "Account does not exist. Please create an account first using add-account (compute ledger missing)."
      );
    }
    throw err instanceof Error ? err : new Error(msg);
  }

  const available = BigInt(ledger[1]) - BigInt(ledger[2]);
  const requiredFee = 4_000_437_000_000_000_00n;
  if (available < requiredFee) {
    try {
      const topUp = requiredFee - available;
      await broker.ledger.depositFund(Number(topUp) / 1e18);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(
        `Compute ledger underfunded — deposit OG then fund a provider. (${msg.slice(0, 120)})`
      );
    }
  }

  await broker.inference.acknowledgeProviderSigner(modelService.provider);
  const metadata = await broker.inference.getServiceMetadata(
    modelService.provider
  );

  const headers = await broker.inference.getRequestHeaders(
    modelService.provider,
    prompt
  );

  const response = await fetch(`${metadata.endpoint}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({
      messages: [{ role: "user", content: prompt }],
      model: metadata.model,
      response_format: { type: "json_object" },
    }),
  });

  const raw = await response.text();
  let data: {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
    id?: string;
  };
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(
      `Inference response was not JSON (${response.status}): ${raw.slice(0, 160)}`
    );
  }
  if (!data.choices?.[0]) {
    throw new Error(data.error?.message || "No inference response");
  }

  const aiOutput = data.choices[0].message?.content;
  if (!aiOutput) throw new Error("Empty inference response");
  await broker.inference.processResponse(
    modelService.provider,
    aiOutput,
    data.id
  );
  return aiOutput;
}
