"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAccount, useSignMessage } from "wagmi";
import {
  Loader2,
  Scale,
  ShieldAlert,
  LineChart,
  Gavel,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertTriangle,
  Fingerprint,
  ShieldCheck,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUserFiles } from "@/hooks/useUserFiles";
import { usefetchFileContent } from "@/hooks/useFileContent";
import { useAddToVault } from "@/hooks/useAddToVault";
import { useAgenticId } from "@/hooks/useAgenticId";
import { isEvidenceCategory, type VaultEvidence } from "@/lib/evidence";
import type {
  BoardSession,
  BoardTurn,
  BoardVerdict,
  GuardStatus,
} from "@/lib/board";
import { boardAuthMessage } from "@/lib/boardAuthMessage";
import { uploadAndRegisterOnVault } from "@/utils/upload";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const DEFAULT_QUESTION =
  "Review my vault evidence and recommend the safest next actions.";

function verdictTone(v: BoardVerdict): string {
  if (v === "approve") return "text-emerald-600 dark:text-emerald-400";
  if (v === "reject") return "text-red-600 dark:text-red-400";
  if (v === "abstain") return "text-muted-foreground";
  return "text-amber-600 dark:text-amber-400";
}

function guardTone(s: GuardStatus): string {
  if (s === "pass") return "border-emerald-500/30 bg-emerald-500/5";
  if (s === "block") return "border-red-500/30 bg-red-500/5";
  return "border-amber-500/30 bg-amber-500/5";
}

function RoleIcon({ role }: { role: BoardTurn["role"] }) {
  if (role === "analyst") return <LineChart className="h-4 w-4" />;
  if (role === "risk") return <AlertTriangle className="h-4 w-4" />;
  if (role === "security") return <ShieldAlert className="h-4 w-4" />;
  return <Gavel className="h-4 w-4" />;
}

function parseEvidence(raw: string): VaultEvidence | null {
  try {
    const parsed = JSON.parse(raw) as VaultEvidence;
    if (parsed?.id && parsed?.type && Array.isArray(parsed.facts)) return parsed;
  } catch {
    // ignore
  }
  return null;
}

type LoadedPack = {
  rootHash: string;
  category: string;
  pack: VaultEvidence;
};

export default function WarRoom() {
  const { isConnected, address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { files, loading: filesLoading, refetch } = useUserFiles();
  const { fetchFileContent } = usefetchFileContent();
  const { addFile } = useAddToVault();
  const {
    agent,
    loading: agentLoading,
    hasAgent,
    bindBoardSession,
    refetch: refetchAgent,
  } = useAgenticId();

  const [packs, setPacks] = useState<LoadedPack[]>([]);
  const [loadingPacks, setLoadingPacks] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [question, setQuestion] = useState(DEFAULT_QUESTION);
  const [mode, setMode] = useState<"auto" | "fast" | "live" | "fallback">(
    "auto"
  );
  const [running, setRunning] = useState(false);
  const [session, setSession] = useState<BoardSession | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedRoot, setSavedRoot] = useState<string | null>(null);
  const [boundTx, setBoundTx] = useState<string | null>(null);

  const loadPacks = useCallback(async () => {
    if (!isConnected) {
      setPacks([]);
      return;
    }
    setLoadingPacks(true);
    try {
      const list = await refetch();
      const evidenceFiles = list.filter((f) => isEvidenceCategory(f.category));
      const loaded: LoadedPack[] = [];

      for (const f of evidenceFiles.slice(0, 20)) {
        if (f.category === "evidence:board") continue;
        try {
          const raw = await fetchFileContent(f.rootHash);
          const pack = parseEvidence(raw);
          if (pack) {
            loaded.push({ rootHash: f.rootHash, category: f.category, pack });
          }
        } catch {
          // skip unreadable
        }
      }
      setPacks(loaded);
      setSelected(new Set(loaded.map((p) => p.pack.id)));
    } finally {
      setLoadingPacks(false);
    }
  }, [fetchFileContent, isConnected, refetch]);

  useEffect(() => {
    void loadPacks();
  }, [loadPacks]);

  const selectedEvidence = useMemo(
    () => packs.filter((p) => selected.has(p.pack.id)).map((p) => p.pack),
    [packs, selected]
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const runBoard = async () => {
    if (!isConnected || !address) {
      toast.error("Connect wallet first");
      return;
    }
    setRunning(true);
    setSavedRoot(null);
    setBoundTx(null);
    try {
      const timestamp = Date.now();
      const message = boardAuthMessage({
        wallet: address,
        timestamp,
        question,
      });
      const signature = await signMessageAsync({ message });

      const res = await fetch("/api/boardSession", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          evidence: selectedEvidence,
          mode,
          agentTokenId: agent ? agent.tokenId.toString() : undefined,
          wallet: address,
          timestamp,
          signature,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Board failed");
      setSession(data.session as BoardSession);
      const g = (data.session as BoardSession).guard?.status;
      toast.success(
        g === "block"
          ? "Board complete — Agentic Firewall blocked unsafe actions"
          : g === "review"
            ? "Board complete — firewall requires human review"
            : "Board session sealed"
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Board failed");
    } finally {
      setRunning(false);
    }
  };

  const saveAndBind = async () => {
    if (!session || !isConnected) return;
    if (session.guard?.status === "block") {
      toast.error("Cannot bind a blocked session as executable guidance");
      // still allow vault archive
    }
    setSaving(true);
    try {
      const sealedSession: BoardSession = {
        ...session,
        agentTokenId: agent?.tokenId.toString() ?? session.agentTokenId,
        chairWallet: address ?? session.chairWallet,
      };
      const file = new File(
        [JSON.stringify(sealedSession, null, 2)],
        `${session.id}.json`,
        { type: "application/json" }
      );
      const result = await uploadAndRegisterOnVault(
        file,
        addFile,
        (rootHash) => rootHash,
        {
          category: "evidence:board",
          useTestnet: true,
          successMessage: "Board transcript saved to vault",
        }
      );
      if (!result) return;

      setSavedRoot(result.rootHash);
      setSession({
        ...sealedSession,
        transcriptRootHash: result.rootHash,
      });

      if (agent && session.guard?.sealHash) {
        try {
          const tx = await bindBoardSession({
            tokenId: agent.tokenId,
            transcriptRootHash: result.rootHash,
            sealHash: session.guard.sealHash,
          });
          setBoundTx(tx);
          setSession((prev) =>
            prev
              ? {
                  ...prev,
                  transcriptRootHash: result.rootHash,
                  boundToAgent: true,
                }
              : prev
          );
          toast.success("Agentic ID profile bound to this board session");
          await refetchAgent();
        } catch (err: unknown) {
          toast.error(
            err instanceof Error
              ? `Saved to vault, but Agentic ID bind failed: ${err.message}`
              : "Saved to vault; Agentic ID bind failed"
          );
        }
      } else if (!agent) {
        toast.message("Transcript saved — mint an Agentic ID to bind as Board Chair");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section
        className={cn(
          "rounded-2xl border px-5 py-4",
          hasAgent
            ? "border-primary/25 bg-primary/[0.03]"
            : "border-dashed bg-muted/20"
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Fingerprint className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Board Chair · Agentic ID</p>
              {agentLoading ? (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Checking on-chain agent…
                </p>
              ) : hasAgent && agent ? (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Token #{agent.tokenId.toString()} · {agent.domain || "no domain"}{" "}
                  · sessions bind to this chair on save
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-0.5">
                  No Agentic ID yet — board still runs; mint to own & seal sessions
                  onchain.
                </p>
              )}
            </div>
          </div>
          {!hasAgent && (
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/agent/mint">Mint Agentic ID</Link>
            </Button>
          )}
        </div>
      </section>

      <section className="rounded-2xl border bg-card overflow-hidden">
        <div className="border-b px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Concierge Board</h2>
              <p className="text-sm text-muted-foreground">
                Analyst · Risk · Security debate → Agentic Firewall seals actions
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => void loadPacks()}
            disabled={loadingPacks || filesLoading}
          >
            {loadingPacks ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh evidence
          </Button>
        </div>

        <div className="p-5 space-y-5">
          {!isConnected && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-muted-foreground">
              Connect your wallet to load vault evidence and run the board.
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Evidence packs</p>
              <p className="text-xs text-muted-foreground">
                {selectedEvidence.length}/{packs.length} selected
              </p>
            </div>
            {loadingPacks ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading vault evidence…
              </div>
            ) : packs.length === 0 ? (
              <div className="rounded-xl border border-dashed px-4 py-8 text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  No evidence packs yet. Sync a wallet or paste a briefing first.
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard/vault/my-files">Go to evidence intake</Link>
                </Button>
              </div>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {packs.map((p) => {
                  const on = selected.has(p.pack.id);
                  return (
                    <li key={p.pack.id}>
                      <button
                        type="button"
                        onClick={() => toggle(p.pack.id)}
                        className={cn(
                          "w-full rounded-xl border px-3 py-3 text-left transition-colors",
                          on
                            ? "border-primary/40 bg-primary/5"
                            : "hover:bg-muted/40"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium truncate">
                            {p.pack.title}
                          </p>
                          {on && (
                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 truncate">
                          {p.category} · {Math.round(p.pack.confidence * 100)}% ·{" "}
                          {p.pack.summary}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Board question</label>
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              disabled={running}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground mr-1">Compute mode</span>
            {(
              [
                ["auto", "Auto"],
                ["fast", "Fast"],
                ["live", "Live swarm"],
                ["fallback", "Offline"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                  mode === value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <Button
            type="button"
            className="w-full sm:w-auto gap-2"
            onClick={() => void runBoard()}
            disabled={running || !isConnected}
          >
            {running ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Scale className="h-4 w-4" />
            )}
            {running ? "Agents debating…" : "Convene the board"}
          </Button>
          {files.length > 0 && packs.length === 0 && !loadingPacks && (
            <p className="text-xs text-muted-foreground">
              Vault has {files.length} registered item(s), but none parsed as
              evidence packs. Re-ingest via wallet/CSV/paste on My Files.
            </p>
          )}
        </div>
      </section>

      {session && (
        <section className="rounded-2xl border bg-card overflow-hidden">
          <div className="border-b px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Debate transcript</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {session.id} · mode {session.computeMode}
                {session.agentTokenId
                  ? ` · chair #${session.agentTokenId}`
                  : ""}
                {session.modelNotes ? ` · ${session.modelNotes}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-xs font-semibold uppercase tracking-wide",
                  verdictTone(session.consensus.verdict)
                )}
              >
                {session.consensus.verdict}
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => void saveAndBind()}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {hasAgent ? "Save & bind to Agentic ID" : "Save to vault"}
              </Button>
            </div>
          </div>

          {session.guard && (
            <div
              className={cn(
                "border-b px-5 py-4 space-y-2",
                guardTone(session.guard.status)
              )}
            >
              <div className="flex items-center gap-2">
                {session.guard.status === "block" ? (
                  <Ban className="h-4 w-4 text-red-600" />
                ) : session.guard.status === "review" ? (
                  <ShieldAlert className="h-4 w-4 text-amber-600" />
                ) : (
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                )}
                <p className="text-sm font-semibold">
                  Agentic Firewall · {session.guard.status}
                </p>
              </div>
              <p className="text-[11px] font-mono text-muted-foreground break-all">
                seal {session.guard.sealHash}
              </p>
              <ul className="text-xs space-y-1 list-disc pl-5 text-muted-foreground">
                {session.guard.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              {session.guard.blockedActions.length > 0 && (
                <div>
                  <p className="text-[11px] font-medium uppercase text-red-600/80 mb-1">
                    Blocked actions
                  </p>
                  <ul className="text-xs list-disc pl-5 space-y-0.5">
                    {session.guard.blockedActions.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </div>
              )}
              {session.guard.allowedActions.length > 0 && (
                <div>
                  <p className="text-[11px] font-medium uppercase text-emerald-700/80 dark:text-emerald-400/80 mb-1">
                    Allowed (non-executing) actions
                  </p>
                  <ul className="text-xs list-disc pl-5 space-y-0.5">
                    {session.guard.allowedActions.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="divide-y">
            {session.turns.map((turn) => (
              <div key={turn.role} className="px-5 py-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground">
                      <RoleIcon role={turn.role} />
                    </span>
                    {turn.name}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium uppercase",
                      verdictTone(turn.stance)
                    )}
                  >
                    {turn.stance}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {turn.argument}
                </p>
                {turn.concerns.length > 0 && (
                  <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-0.5">
                    {turn.concerns.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                )}
                {turn.citations.length > 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    Citations: {turn.citations.join(", ")}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="border-t bg-muted/20 px-5 py-5 space-y-3">
            <div className="flex items-center gap-2">
              <Gavel className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Chair consensus</p>
              <span className="text-xs text-muted-foreground">
                {Math.round(session.consensus.confidence * 100)}% confidence
              </span>
            </div>
            <p className="text-sm leading-relaxed">{session.consensus.summary}</p>
            {session.consensus.dissent.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5">
                  Dissent
                </p>
                <ul className="text-sm space-y-1 list-disc pl-5 text-muted-foreground">
                  {session.consensus.dissent.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </div>
            )}
            {savedRoot && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                Vault transcript · {savedRoot.slice(0, 18)}…
                {boundTx ? ` · Agentic ID bound (${boundTx.slice(0, 12)}…)` : ""}
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
