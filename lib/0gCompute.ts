import { createZGComputeNetworkBroker } from "@0gfoundation/0g-compute-ts-sdk";
import { ethers } from "ethers";

async function getBroker() {
  const rpcUrl = process.env.GALILEO_RPC_URL;
  const privateKey = process.env.GALILEO_PRIVATE_KEY;
  if (!rpcUrl || !privateKey) {
    throw new Error("Missing GALILEO_RPC_URL or GALILEO_PRIVATE_KEY");
  }
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);
  return createZGComputeNetworkBroker(signer);
}

/** Run a prompt through 0G Compute and return the assistant message text. */
export async function run0GInference(prompt: string): Promise<string> {
  const broker = await getBroker();

  const services = await broker.inference.listService();
  if (!services.length) throw new Error("No available 0G Compute services");

  const modelService = services[0];

  const ledger = await broker.ledger.getLedger();
  const available = BigInt(ledger[1]) - BigInt(ledger[2]);
  const requiredFee = 4_000_437_000_000_000_00n;
  if (available < requiredFee) {
    const topUp = requiredFee - available;
    await broker.ledger.depositFund(Number(topUp) / 1e18);
  }

  await broker.inference.acknowledgeProviderSigner(modelService.provider);
  const metadata = await broker.inference.getServiceMetadata(modelService.provider);

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
  const data = JSON.parse(raw);
  if (!data.choices?.[0]) {
    throw new Error(data.error?.message || "No inference response");
  }

  const aiOutput = data.choices[0].message.content;
  await broker.inference.processResponse(modelService.provider, aiOutput, data.id);
  return aiOutput;
}
