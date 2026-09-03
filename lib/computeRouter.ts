import { getOperatorComputeConfig } from "@/lib/computeOperator";
import { resolveLiveRouterModel } from "@/lib/computeRouterModels";

type RouterCompletion = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

function isModelNotFoundError(message: string): boolean {
  return /model not found/i.test(message);
}

async function runRouterOnce(
  prompt: string,
  model: string,
  options?: { json?: boolean }
): Promise<string> {
  const apiKey = process.env.OG_ROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "OG_ROUTER_API_KEY not configured — add your Private Computer API key."
    );
  }

  const cfg = getOperatorComputeConfig();
  const body: Record<string, unknown> = {
    model,
    messages: [{ role: "user", content: prompt }],
  };
  if (options?.json) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(`${cfg.routerBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const raw = await res.text();
  let data: RouterCompletion;
  try {
    data = JSON.parse(raw) as RouterCompletion;
  } catch {
    throw new Error(
      `Router response was not JSON (${res.status}): ${raw.slice(0, 200)}`
    );
  }

  if (!res.ok) {
    throw new Error(
      data.error?.message ||
        `Router inference failed (${res.status}): ${raw.slice(0, 200)}`
    );
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content?.trim()) {
    throw new Error("Empty response from 0G Router");
  }
  return content;
}

/** Run inference via 0G Private Computer Router (OpenAI-compatible). */
export async function runRouterInference(
  prompt: string,
  options?: { json?: boolean; model?: string | null }
): Promise<string> {
  const model = await resolveLiveRouterModel(options?.model);
  try {
    return await runRouterOnce(prompt, model, options);
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    if (!isModelNotFoundError(error.message)) throw error;
    const fallback = await resolveLiveRouterModel(null);
    if (fallback === model) throw error;
    return runRouterOnce(prompt, fallback, options);
  }
}
