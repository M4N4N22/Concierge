export type ComputeErrorCode =
  | "ENV_MISSING"
  | "LEDGER_MISSING"
  | "LEDGER_UNFUNDED"
  | "NO_PROVIDERS"
  | "INFERENCE_FAILED"
  | "UNKNOWN";

export type ClassifiedComputeError = {
  code: ComputeErrorCode;
  title: string;
  message: string;
  /** UI should open the 0G Compute setup panel */
  action: "open_compute_setup";
  raw?: string;
};

/** Map broker / inference failures to actionable codes for the desk UI. */
export function classifyComputeError(raw: unknown): ClassifiedComputeError {
  const text =
    raw instanceof Error
      ? raw.message
      : typeof raw === "string"
        ? raw
        : "Unknown compute error";
  const lower = text.toLowerCase();

  if (
    lower.includes("missing galileo_rpc_url") ||
    lower.includes("missing galileo_private_key") ||
    lower.includes("missing og_mainnet_rpc_url") ||
    lower.includes("missing og_mainnet_private_key") ||
    (lower.includes("galileo") && lower.includes("private_key")) ||
    (lower.includes("og_mainnet") && lower.includes("private_key"))
  ) {
    return {
      code: "ENV_MISSING",
      title: "Server compute keys missing",
      message:
        "Set OG_MAINNET_RPC_URL + OG_MAINNET_PRIVATE_KEY for mainnet, or GALILEO_RPC_URL + GALILEO_PRIVATE_KEY for testnet, then restart.",
      action: "open_compute_setup",
      raw: text,
    };
  }

  if (
    lower.includes("account does not exist") ||
    lower.includes("create an account") ||
    lower.includes("add-account") ||
    lower.includes("ledger not") ||
    lower.includes("no compute ledger") ||
    lower.includes("compute ledger missing")
  ) {
    return {
      code: "LEDGER_MISSING",
      title: "Compute ledger not created",
      message:
        "The 0G Compute broker wallet has no ledger yet. Create one and deposit OG before agents can run.",
      action: "open_compute_setup",
      raw: text,
    };
  }

  if (
    lower.includes("insufficient") ||
    lower.includes("not enough") ||
    (lower.includes("fund") && lower.includes("ledger")) ||
    lower.includes("deposit")
  ) {
    return {
      code: "LEDGER_UNFUNDED",
      title: "Compute ledger underfunded",
      message:
        "Ledger exists but available OG is too low for inference. Deposit OG and fund a provider.",
      action: "open_compute_setup",
      raw: text,
    };
  }

  if (
    lower.includes("no available") ||
    lower.includes("no service") ||
    lower.includes("listservice")
  ) {
    return {
      code: "NO_PROVIDERS",
      title: "No compute providers",
      message:
        "0G Compute returned no inference services. Check network / provider availability.",
      action: "open_compute_setup",
      raw: text,
    };
  }

  if (
    lower.includes("inference") ||
    lower.includes("chat/completions") ||
    lower.includes("no inference response")
  ) {
    return {
      code: "INFERENCE_FAILED",
      title: "Inference failed",
      message: text.slice(0, 240),
      action: "open_compute_setup",
      raw: text,
    };
  }

  return {
    code: "UNKNOWN",
    title: "0G Compute unavailable",
    message: text.slice(0, 240),
    action: "open_compute_setup",
    raw: text,
  };
}
