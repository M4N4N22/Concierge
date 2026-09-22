export const AUTO_MODEL_ID = "auto";

export type ChatApiFormat = "openai" | "anthropic";

export type ComputeModelOption = {
  id: string;
  label: string;
  description?: string;
  /** Vendor / family for picker grouping */
  company: string;
  /** Router catalog type, e.g. chatbot */
  type: string;
  /** APIs this model accepts on the Router */
  formats: ChatApiFormat[];
  /** Preferred request path for Concierge inference */
  preferredFormat: ChatApiFormat;
};

/** Fallback if the live Router catalog cannot be loaded. */
export const FALLBACK_ROUTER_MODEL = "glm-5.3-flash";

export function getDefaultRouterModel(): string {
  return process.env.OG_ROUTER_MODEL?.trim() || FALLBACK_ROUTER_MODEL;
}

export function preferChatFormat(formats: string[]): ChatApiFormat {
  if (formats.includes("openai")) return "openai";
  if (formats.includes("anthropic")) return "anthropic";
  return "openai";
}

/**
 * Infer vendor from model id/name only.
 * Do not use description — many blurbs mention API formats ("OpenAI and Anthropic faces")
 * and would mis-group models like GLM under Anthropic.
 */
export function inferModelCompany(id: string, name?: string): string {
  const s = `${id} ${name ?? ""}`.toLowerCase();
  if (/claude/.test(s)) return "Anthropic";
  if (/(^|\/)gpt-|o[1-9]/.test(s)) return "OpenAI";
  if (/gemini/.test(s)) return "Google";
  if (/qwen|qianfan/.test(s)) return "Alibaba";
  if (/\bglm|zhipu|zai-org/.test(s)) return "Zhipu";
  if (/deepseek/.test(s)) return "DeepSeek";
  if (/kimi|moonshot/.test(s)) return "Moonshot";
  if (/ernie/.test(s)) return "Baidu";
  if (/minimax/.test(s)) return "MiniMax";
  if (/(^|\/)hy\d|hunyuan/.test(s)) return "Tencent";
  if (/mimo/.test(s)) return "Xiaomi";
  if (/longcat/.test(s)) return "Meituan";
  if (/(^|\/)0gm/.test(s)) return "0G";
  return "Other";
}

/** Display order for company groups in the picker. */
export const MODEL_COMPANY_ORDER = [
  "0G",
  "Anthropic",
  "OpenAI",
  "Google",
  "DeepSeek",
  "Alibaba",
  "Zhipu",
  "Moonshot",
  "Baidu",
  "MiniMax",
  "Tencent",
  "Xiaomi",
  "Meituan",
  "Other",
] as const;

export function companySortIndex(company: string): number {
  const i = MODEL_COMPANY_ORDER.indexOf(
    company as (typeof MODEL_COMPANY_ORDER)[number]
  );
  return i === -1 ? MODEL_COMPANY_ORDER.length : i;
}

function catalogEntry(
  id: string,
  label: string,
  description?: string
): ComputeModelOption {
  const formats: ChatApiFormat[] = ["openai"];
  return {
    id,
    label,
    description,
    company: inferModelCompany(id, label),
    type: "chatbot",
    formats,
    preferredFormat: "openai",
  };
}

/** Static fallback if GET /v1/models is unreachable. */
export const ROUTER_MODEL_CATALOG: ComputeModelOption[] = [
  catalogEntry("glm-5.3-flash", "GLM 5.3 Flash", "Cheapest"),
  catalogEntry("qwen3.8-flash", "Qwen 3.8 Flash"),
  catalogEntry("deepseek-v4-flash", "DeepSeek V4 Flash"),
  catalogEntry("hy3", "Hunyuan 3"),
  catalogEntry("glm-5.2", "GLM 5.2"),
];

export function resolveRouterModel(selected?: string | null): string {
  const pick = selected?.trim();
  if (!pick || pick === AUTO_MODEL_ID) return getDefaultRouterModel();
  return pick;
}

export function modelLabel(modelId: string): string {
  if (modelId === AUTO_MODEL_ID) return "Cheapest";
  const hit = ROUTER_MODEL_CATALOG.find((m) => m.id === modelId);
  if (hit) return hit.label;
  const short = modelId.split("/").pop() ?? modelId;
  return short.length > 24 ? `${short.slice(0, 22)}…` : short;
}
