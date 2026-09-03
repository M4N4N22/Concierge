import type { UseHistory, UseMark } from "@/lib/lendAccess/types";
import { emptyUseHistory } from "@/lib/lendAccess/types";

/** Record a use mark — Wave 4+ will persist these next to the Agentic ID. */
export function appendUseMark(
  history: UseHistory | null | undefined,
  mark: Omit<UseMark, "id" | "createdAt"> & {
    id?: string;
    createdAt?: number;
  }
): UseHistory {
  const base = history ?? emptyUseHistory();
  const createdAt = mark.createdAt ?? Math.floor(Date.now() / 1000);
  const next: UseMark = {
    id: mark.id ?? `use-${createdAt.toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    kind: mark.kind,
    proofRef: mark.proofRef,
    createdAt,
    note: mark.note,
  };
  return {
    ...base,
    marks: [next, ...base.marks].slice(0, 200),
  };
}

export function countMarksByKind(history: UseHistory): Record<UseMark["kind"], number> {
  const out: Record<UseMark["kind"], number> = {
    chat: 0,
    knowledge: 0,
    lend: 0,
    "trade-assist": 0,
  };
  for (const m of history.marks) out[m.kind] += 1;
  return out;
}
