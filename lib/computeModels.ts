export const AUTO_MODEL_ID = "auto";

export type ComputeModelOption = {
  id: string;
  label: string;
  description?: string;
};

export function getDefaultRouterModel(): string {
  return (
    process.env.OG_ROUTER_MODEL?.trim() || "phala/deepseek-chat-v3-0324"
  );
}

/** Curated Router models — Auto uses OG_ROUTER_MODEL from env. */
export const ROUTER_MODEL_CATALOG: ComputeModelOption[] = [
  {
    id: AUTO_MODEL_ID,
    label: "Auto",
    description: "Default model for Concierge",
  },
  {
    id: "phala/deepseek-chat-v3-0324",
    label: "DeepSeek V3",
    description: "Fast · economical",
  },
  {
    id: "phala/gpt-oss-120b",
    label: "GPT OSS 120B",
    description: "High accuracy",
  },
  {
    id: "phala/qwen2.5-vl-72b-instruct",
    label: "Qwen 2.5 VL",
    description: "Multimodal",
  },
  {
    id: "openai/gpt-oss-120b",
    label: "GPT OSS (OpenAI)",
    description: "Reliable · large context",
  },
];

export function resolveRouterModel(selected?: string | null): string {
  const pick = selected?.trim();
  if (!pick || pick === AUTO_MODEL_ID) return getDefaultRouterModel();
  return pick;
}

export function modelLabel(modelId: string): string {
  if (modelId === AUTO_MODEL_ID) return "Auto";
  const hit = ROUTER_MODEL_CATALOG.find((m) => m.id === modelId);
  if (hit) return hit.label;
  const short = modelId.split("/").pop() ?? modelId;
  return short.length > 24 ? `${short.slice(0, 22)}…` : short;
}
