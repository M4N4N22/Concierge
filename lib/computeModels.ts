export const AUTO_MODEL_ID = "auto";

export type ComputeModelOption = {
  id: string;
  label: string;
  description?: string;
};

/** Fallback if the live Router catalog cannot be loaded. */
export const FALLBACK_ROUTER_MODEL = "glm-5.3-flash";

export function getDefaultRouterModel(): string {
  return process.env.OG_ROUTER_MODEL?.trim() || FALLBACK_ROUTER_MODEL;
}

/** Static fallback if GET /v1/models is unreachable. */
export const ROUTER_MODEL_CATALOG: ComputeModelOption[] = [
  {
    id: "glm-5.3-flash",
    label: "GLM 5.3 Flash",
    description: "Cheapest",
  },
  {
    id: "qwen3.8-flash",
    label: "Qwen 3.8 Flash",
  },
  {
    id: "deepseek-v4-flash",
    label: "DeepSeek V4 Flash",
  },
  {
    id: "hy3",
    label: "Hunyuan 3",
  },
  {
    id: "glm-5.2",
    label: "GLM 5.2",
  },
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
