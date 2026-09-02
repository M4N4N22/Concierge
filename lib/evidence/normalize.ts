import {
  createEvidenceId,
  EVIDENCE_SCHEMA_VERSION,
  type EvidenceFact,
  type EvidenceSource,
  type EvidenceType,
  type VaultEvidence,
} from "./types";

const NUM =
  "(-?\\d{1,3}(?:,\\d{3})*(?:\\.\\d{1,8})?|-?\\d+(?:\\.\\d{1,8})?)";
const CODE = "(?:USD|OG|ETH|EUR|GBP)";
const SYM = "(?:\\$|€|£)";
/** Currency symbol/code before or after amount, or spend-keyword + amount. Dates stripped first. */
const AMOUNT_RE = new RegExp(
  `(?:${CODE}\\s+${NUM})|(?:${SYM}\\s*${NUM})|(?:${NUM}\\s*(?:${CODE}|${SYM})\\b)|(?:\\b(?:spent|amount|total|price|cost|paid|charge)\\b[:\\s]+${NUM})`,
  "gi"
);
const DATE_RE =
  /\b(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})\b/gi;

function clampConfidence(n: number): number {
  return Math.max(0.1, Math.min(1, n));
}

function firstLine(text: string, max = 80): string {
  const line = text.split(/\r?\n/).map((l) => l.trim()).find(Boolean) ?? "Parsed file";
  return line.length > max ? `${line.slice(0, max - 1)}…` : line;
}

/** Strip date tokens so ISO dates are not parsed as monetary amounts. */
function stripDates(text: string): string {
  return text.replace(DATE_RE, " ");
}

function extractAmounts(text: string): number[] {
  const amounts: number[] = [];
  const re = new RegExp(AMOUNT_RE.source, "gi");
  const scrubbed = stripDates(text);
  let m: RegExpExecArray | null;
  while ((m = re.exec(scrubbed)) !== null) {
    const raw = m[1] ?? m[2] ?? m[3] ?? m[4];
    if (!raw) continue;
    const n = Number(raw.replace(/,/g, ""));
    if (!Number.isNaN(n) && Math.abs(n) > 0) amounts.push(n);
  }
  return amounts;
}

function extractDates(text: string): string[] {
  const dates: string[] = [];
  const re = new RegExp(DATE_RE);
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    dates.push(m[1]);
  }
  return [...new Set(dates)].slice(0, 8);
}

function inferTypeFromText(text: string): EvidenceType {
  const lower = text.toLowerCase();
  if (/flight|hotel|itinerary|boarding|airline|trip/.test(lower)) return "travel";
  if (/subscription|recurring|netflix|spotify|saas|membership|renewal/.test(lower))
    return "subscription";
  if (/0x[a-f0-9]{64}|approval|spender|contract|bytecode/.test(lower)) return "tx";
  if (/invoice|receipt|spent|payment|bill|usd|\$|dining|purchase/.test(lower))
    return "spend";
  return "document";
}

/** Normalize free text / receipt paste into a VaultEvidence pack. */
export function normalizeTextEvidence(
  text: string,
  options?: {
    source?: EvidenceSource;
    fileName?: string;
    type?: EvidenceType;
    wallet?: string;
    chainId?: number;
  }
): VaultEvidence {
  const trimmed = text.trim();
  const type = options?.type ?? inferTypeFromText(trimmed);
  const amounts = extractAmounts(trimmed);
  const dates = extractDates(trimmed);
  const facts: EvidenceFact[] = [];

  if (options?.fileName) {
    facts.push({ key: "fileName", value: options.fileName, confidence: 1 });
  }
  amounts.slice(0, 5).forEach((amount, i) => {
    facts.push({
      key: amounts.length === 1 ? "amount" : `amount_${i + 1}`,
      value: amount,
      unit: "USD",
      confidence: 0.75,
    });
  });
  dates.forEach((date, i) => {
    facts.push({
      key: dates.length === 1 ? "date" : `date_${i + 1}`,
      value: date,
      confidence: 0.7,
    });
  });

  const merchantMatch = trimmed.match(
    /(?:at|from|to|merchant|vendor)[:\s]+([A-Za-z0-9 &.'-]{2,40})/i
  );
  if (merchantMatch?.[1]) {
    facts.push({
      key: "counterparty",
      value: merchantMatch[1].trim(),
      confidence: 0.65,
    });
  }

  const confidence = clampConfidence(
    0.4 + (amounts.length ? 0.25 : 0) + (dates.length ? 0.15 : 0) + (facts.length > 2 ? 0.1 : 0)
  );

  const title =
    options?.fileName?.replace(/\.[^.]+$/, "") ||
    (type === "spend" && amounts[0] != null
      ? `Spend $${amounts[0]}`
      : firstLine(trimmed));

  return {
    schemaVersion: EVIDENCE_SCHEMA_VERSION,
    id: createEvidenceId(type),
    type,
    source: options?.source ?? "paste",
    title,
    summary:
      amounts.length > 0
        ? `${type} evidence with ${amounts.length} amount(s)${dates[0] ? ` · ${dates[0]}` : ""}`
        : firstLine(trimmed, 140),
    facts,
    rawExcerpt: trimmed.slice(0, 2000),
    wallet: options?.wallet,
    chainId: options?.chainId,
    createdAt: new Date().toISOString(),
    confidence,
  };
}

type CsvRow = Record<string, string>;

function parseCsv(text: string): { headers: string[]; rows: CsvRow[] } {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };

  const split = (line: string): string[] => {
    const cells: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        cells.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }
    cells.push(cur.trim());
    return cells;
  };

  const headers = split(lines[0]).map((h) => h.toLowerCase());
  const rows = lines.slice(1, 201).map((line) => {
    const cells = split(line);
    const row: CsvRow = {};
    headers.forEach((h, i) => {
      row[h] = cells[i] ?? "";
    });
    return row;
  });
  return { headers, rows };
}

function pickColumn(headers: string[], candidates: string[]): string | null {
  for (const c of candidates) {
    const hit = headers.find((h) => h === c || h.includes(c));
    if (hit) return hit;
  }
  return null;
}

/** Normalize bank/subscription CSV exports into spend or subscription evidence. */
export function normalizeCsvEvidence(
  text: string,
  options?: {
    fileName?: string;
    wallet?: string;
    chainId?: number;
    source?: EvidenceSource;
  }
): VaultEvidence {
  const { headers, rows } = parseCsv(text);
  if (!headers.length || !rows.length) {
    return normalizeTextEvidence(text, {
      ...options,
      source: options?.source ?? "csv",
      type: "document",
    });
  }

  const dateCol = pickColumn(headers, ["date", "posted", "transaction date", "time"]);
  const descCol = pickColumn(headers, [
    "description",
    "memo",
    "narrative",
    "merchant",
    "name",
    "payee",
  ]);
  const amountCol = pickColumn(headers, [
    "amount",
    "debit",
    "credit",
    "value",
    "price",
    "usd",
    "charge",
  ]);

  const isSubscriptionish = /subscription|recurring|plan|billing/.test(
    (options?.fileName ?? "").toLowerCase() + headers.join(" ")
  );

  const facts: EvidenceFact[] = [
    { key: "rowCount", value: rows.length, confidence: 1 },
    { key: "columns", value: headers.join(", "), confidence: 1 },
  ];

  let total = 0;
  let parsedAmounts = 0;
  const sampleRows: string[] = [];

  for (const row of rows.slice(0, 50)) {
    const rawAmount = amountCol ? row[amountCol] : "";
    if (amountCol && String(rawAmount).trim() !== "") {
      const amount = Number(String(rawAmount).replace(/[$,]/g, ""));
      if (!Number.isNaN(amount)) {
        total += amount;
        parsedAmounts++;
      }
    }
    const desc = descCol ? row[descCol] : Object.values(row).slice(0, 2).join(" ");
    const date = dateCol ? row[dateCol] : "";
    if (sampleRows.length < 5 && (desc || date)) {
      sampleRows.push([date, desc, rawAmount].filter(Boolean).join(" · "));
    }
  }

  if (parsedAmounts > 0) {
    facts.push({
      key: "totalAmount",
      value: Number(total.toFixed(2)),
      unit: "USD",
      confidence: 0.85,
    });
    facts.push({
      key: "parsedRows",
      value: parsedAmounts,
      confidence: 0.9,
    });
  }

  sampleRows.forEach((line, i) => {
    facts.push({ key: `sample_${i + 1}`, value: line, confidence: 0.8 });
  });

  const type: EvidenceType = isSubscriptionish ? "subscription" : "spend";

  return {
    schemaVersion: EVIDENCE_SCHEMA_VERSION,
    id: createEvidenceId(type),
    type,
    source: options?.source ?? "csv",
    title: options?.fileName?.replace(/\.[^.]+$/, "") || `CSV ${type} import`,
    summary: `${rows.length} rows · ${parsedAmounts} amounts${
      parsedAmounts ? ` · total $${total.toFixed(2)}` : ""
    }`,
    facts,
    rawExcerpt: text.slice(0, 2000),
    wallet: options?.wallet,
    chainId: options?.chainId,
    createdAt: new Date().toISOString(),
    confidence: clampConfidence(0.55 + (parsedAmounts > 0 ? 0.3 : 0) + (dateCol ? 0.1 : 0)),
  };
}

export type WalletTransfer = {
  txHash: string;
  blockNumber: number;
  from: string;
  to: string;
  value: string;
  tokenAddress: string;
  direction: "in" | "out";
};

/** Build a wallet snapshot evidence pack from balance + recent transfers. */
export function normalizeWalletEvidence(input: {
  address: string;
  chainId: number;
  nativeBalanceOg: string;
  transfers: WalletTransfer[];
}): VaultEvidence {
  const { address, chainId, nativeBalanceOg, transfers } = input;
  const facts: EvidenceFact[] = [
    { key: "address", value: address, confidence: 1 },
    { key: "chainId", value: chainId, confidence: 1 },
    {
      key: "nativeBalance",
      value: nativeBalanceOg,
      unit: "OG",
      confidence: 1,
    },
    { key: "transferCount", value: transfers.length, confidence: 1 },
  ];

  const outbound = transfers.filter((t) => t.direction === "out").length;
  const inbound = transfers.filter((t) => t.direction === "in").length;
  facts.push({ key: "outboundTransfers", value: outbound, confidence: 1 });
  facts.push({ key: "inboundTransfers", value: inbound, confidence: 1 });

  transfers.slice(0, 10).forEach((t, i) => {
    facts.push({
      key: `transfer_${i + 1}`,
      value: `${t.direction} ${t.value} · ${t.txHash.slice(0, 10)}…`,
      confidence: 0.95,
    });
  });

  return {
    schemaVersion: EVIDENCE_SCHEMA_VERSION,
    id: createEvidenceId("wallet"),
    type: "wallet",
    source: "wallet",
    title: `Wallet snapshot ${address.slice(0, 6)}…${address.slice(-4)}`,
    summary: `${nativeBalanceOg} OG · ${transfers.length} recent token transfers (${outbound} out / ${inbound} in)`,
    facts,
    wallet: address,
    chainId,
    createdAt: new Date().toISOString(),
    confidence: 0.95,
  };
}

/** Board briefing: user pastes a decision context (tx, proposal, receipt). */
export function normalizeBriefingEvidence(
  text: string,
  options?: { wallet?: string; chainId?: number; title?: string }
): VaultEvidence {
  const base = normalizeTextEvidence(text, {
    source: "paste",
    type: "briefing",
    wallet: options?.wallet,
    chainId: options?.chainId,
  });
  return {
    ...base,
    type: "briefing",
    title: options?.title?.trim() || base.title || "Board briefing",
    summary: `Briefing for board session · confidence ${Math.round(base.confidence * 100)}%`,
  };
}

/** Auto-pick normalizer from file name + content. */
export function normalizeFromFileContent(
  fileName: string,
  content: string,
  options?: { wallet?: string; chainId?: number; source?: EvidenceSource }
): VaultEvidence {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".csv") || content.includes(",") && content.split("\n")[0]?.includes(",")) {
    return normalizeCsvEvidence(content, {
      fileName,
      wallet: options?.wallet,
      chainId: options?.chainId,
      source: options?.source ?? "upload",
    });
  }
  return normalizeTextEvidence(content, {
    fileName,
    wallet: options?.wallet,
    chainId: options?.chainId,
    source: options?.source ?? "upload",
  });
}

export function evidenceToFile(pack: VaultEvidence): File {
  const body = JSON.stringify(pack, null, 2);
  return new File([body], `${pack.id}.json`, { type: "application/json" });
}
