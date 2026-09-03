import { getOperatorComputeConfig } from "@/lib/computeOperator";
import { withTtlCache } from "@/lib/ttlCache";
import { AUTO_MODEL_ID, getDefaultRouterModel } from "@/lib/computeModels";

export type LiveRouterModel = {
  id: string;
  name: string;
  description?: string;
  type?: string;
  providerCount: number;
  formats: string[];
  promptUsd: number;
  completionUsd: number;
};

const LIVE_MODELS_TTL_MS = 5 * 60_000;

function routerModelsUrl(): string {
  const base = getOperatorComputeConfig().routerBaseUrl.replace(/\/$/, "");
  return `${base}/models`;
}

function parseUsd(value: unknown): number {
  const n = typeof value === "string" ? Number(value) : Number(value ?? NaN);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function costScore(m: LiveRouterModel): number {
  if (m.promptUsd <= 0 && m.completionUsd <= 0) {
    return Number.POSITIVE_INFINITY;
  }
  return m.promptUsd + m.completionUsd;
}

export function sortByCheapest(models: LiveRouterModel[]): LiveRouterModel[] {
  return [...models].sort((a, b) => costScore(a) - costScore(b));
}

export async function listLiveRouterModels(): Promise<LiveRouterModel[]> {
  return withTtlCache("router:live-models", LIVE_MODELS_TTL_MS, async () => {
    const res = await fetch(routerModelsUrl(), { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Router model list failed (${res.status})`);
    }
    const data = (await res.json()) as {
      data?: Array<{
        id?: string;
        name?: string;
        description?: string;
        type?: string;
        provider_count?: number;
        supported_formats?: string[];
        pricing_usd?: { prompt?: string; completion?: string };
      }>;
    };
    return (data.data ?? [])
      .filter((m) => typeof m.id === "string" && m.id.length > 0)
      .map((m) => ({
        id: m.id as string,
        name: m.name || (m.id as string),
        description: m.description,
        type: m.type,
        providerCount: m.provider_count ?? 0,
        formats: m.supported_formats ?? ["openai"],
        promptUsd: parseUsd(m.pricing_usd?.prompt),
        completionUsd: parseUsd(m.pricing_usd?.completion),
      }));
  });
}

export function isLiveChatModel(m: LiveRouterModel): boolean {
  return (
    (m.type === "chatbot" || !m.type) &&
    m.providerCount > 0 &&
    m.formats.includes("openai")
  );
}

export async function listLiveChatModels(): Promise<LiveRouterModel[]> {
  const models = await listLiveRouterModels();
  return sortByCheapest(models.filter(isLiveChatModel));
}

export async function listLiveChatModelIds(): Promise<string[]> {
  const models = await listLiveChatModels();
  return models.map((m) => m.id);
}

/** Explicit pick if it exists; otherwise the cheapest live chatbot. */
export async function resolveLiveRouterModel(
  selected?: string | null
): Promise<string> {
  const preferred = selected?.trim();
  const configured = getDefaultRouterModel();

  let chat: LiveRouterModel[] = [];
  try {
    chat = await listLiveChatModels();
  } catch {
    return preferred && preferred !== AUTO_MODEL_ID ? preferred : configured;
  }

  if (
    preferred &&
    preferred !== AUTO_MODEL_ID &&
    chat.some((m) => m.id === preferred)
  ) {
    return preferred;
  }

  return chat[0]?.id ?? configured;
}
