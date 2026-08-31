"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAccount, useSignMessage } from "wagmi";
import {
  Loader2,
  ShieldAlert,
  LineChart,
  Gavel,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FieldLabel, Hint } from "@/components/ui/hint";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { TradeDesk } from "@/components/trade/TradeDesk";
import { useUserFiles } from "@/hooks/useUserFiles";
import { usefetchFileContent } from "@/hooks/useFileContent";
import { useAddToVault } from "@/hooks/useAddToVault";
import { useAgenticId } from "@/hooks/useAgenticId";
import { isEvidenceCategory, type VaultEvidence } from "@/lib/evidence";
import type {
  BoardSession,
  BoardTurn,
  BoardVerdict,
} from "@/lib/board";
import { boardAuthMessage } from "@/lib/boardAuthMessage";
import { uploadAndRegisterOnVault } from "@/utils/upload";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const DEFAULT_QUESTION =
  "Review my vault evidence and recommend the safest next actions including any OG trades.";

function verdictTone(v: BoardVerdict) {
  if (v === "approve") return "text-[var(--success)]";
  if (v === "reject") return "text-[var(--danger)]";
  if (v === "abstain") return "text-muted-foreground";
  return "text-amber-500";
}

function RoleIcon({ role }: { role: BoardTurn["role"] }) {
  if (role === "analyst") return <LineChart className="h-3.5 w-3.5" />;
  if (role === "risk") return <AlertTriangle className="h-3.5 w-3.5" />;
  if (role === "security") return <ShieldAlert className="h-3.5 w-3.5" />;
  return <Gavel className="h-3.5 w-3.5" />;
}

function parseEvidence(raw: string): VaultEvidence | null {
  try {
    const parsed = JSON.parse(raw) as VaultEvidence;
    if (parsed?.id && parsed?.type && Array.isArray(parsed.facts)) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

type LoadedPack = { rootHash: string; category: string; pack: VaultEvidence };

export default function WarRoom() {
  const { isConnected, address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { files, loading: filesLoading, refetch } = useUserFiles();
  const { fetchFileContent } = usefetchFileContent();
  const { addFile } = useAddToVault();
  const { agent, loading: agentLoading, hasAgent, bindBoardSession, refetch: refetchAgent } =
    useAgenticId();

  const [packs, setPacks] = useState<LoadedPack[]>([]);
  const [loadingPacks, setLoadingPacks] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [question, setQuestion] = useState(DEFAULT_QUESTION);
  const [mode, setMode] = useState<"auto" | "fast" | "live" | "fallback">("auto");
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
      const loaded: LoadedPack[] = [];
      for (const f of list.filter((x) => isEvidenceCategory(x.category)).slice(0, 20)) {
        if (f.category === "evidence:board") continue;
        try {
          const pack = parseEvidence(await fetchFileContent(f.rootHash));
          if (pack) loaded.push({ rootHash: f.rootHash, category: f.category, pack });
        } catch {
          /* skip */
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

  const runBoard = async () => {
    if (!isConnected || !address) {
      toast.error("Connect wallet");
      return;
    }
    setRunning(true);
    setSavedRoot(null);
    setBoundTx(null);
    try {
      const timestamp = Date.now();
      const message = boardAuthMessage({ wallet: address, timestamp, question });
      const signature = await signMessageAsync({ message });
      const res = await fetch("/api/boardSession", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          evidence: selectedEvidence,
          mode,
          agentTokenId: agent?.tokenId.toString(),
          wallet: address,
          timestamp,
          signature,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Board failed");
      setSession(data.session as BoardSession);
      toast.success("Board sealed");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Board failed");
    } finally {
      setRunning(false);
    }
  };

  const saveAndBind = async () => {
    if (!session || !isConnected) return;
    setSaving(true);
    try {
      const sealed: BoardSession = {
        ...session,
        agentTokenId: agent?.tokenId.toString() ?? session.agentTokenId,
        chairWallet: address ?? session.chairWallet,
      };
      const file = new File([JSON.stringify(sealed, null, 2)], `${session.id}.json`, {
        type: "application/json",
      });
      const result = await uploadAndRegisterOnVault(file, addFile, (h) => h, {
        category: "evidence:board",
        useTestnet: true,
        successMessage: "Transcript saved",
      });
      if (!result) return;
      setSavedRoot(result.rootHash);
      setSession({ ...sealed, transcriptRootHash: result.rootHash });
      if (agent && session.guard?.sealHash) {
        try {
          const tx = await bindBoardSession({
            tokenId: agent.tokenId,
            transcriptRootHash: result.rootHash,
            sealHash: session.guard.sealHash,
          });
          setBoundTx(tx);
          setSession((p) =>
            p ? { ...p, transcriptRootHash: result.rootHash, boundToAgent: true } : p
          );
          toast.success("Bound to Agentic ID");
          await refetchAgent();
        } catch (err: unknown) {
          toast.error(err instanceof Error ? err.message : "Bind failed");
        }
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <Panel>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-medium">Chair</span>
            <Hint text="Your minted Agentic ID chairs this board. Sessions bind to it on save." />
          </div>
          {agentLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          ) : hasAgent && agent ? (
            <span className="font-mono text-xs text-muted-foreground">
              #{agent.tokenId.toString()}
            </span>
          ) : (
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/agent/mint">Mint</Link>
            </Button>
          )}
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title="Evidence"
          hint="Select schema packs from your vault. Agents debate these facts only."
          action={
            <Button
              size="sm"
              variant="ghost"
              onClick={() => void loadPacks()}
              disabled={loadingPacks || filesLoading}
            >
              {loadingPacks ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
            </Button>
          }
        />

        {loadingPacks ? (
          <p className="text-xs text-muted-foreground">Loading…</p>
        ) : packs.length === 0 ? (
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>No evidence packs</span>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/vault/my-files">Ingest</Link>
            </Button>
          </div>
        ) : (
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {packs.map((p) => {
              const on = selected.has(p.pack.id);
              return (
                <li key={p.pack.id}>
                  <button
                    type="button"
                    onClick={() =>
                      setSelected((prev) => {
                        const n = new Set(prev);
                        if (n.has(p.pack.id)) n.delete(p.pack.id);
                        else n.add(p.pack.id);
                        return n;
                      })
                    }
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                      on ? "bg-muted" : "hover:bg-muted/50"
                    )}
                  >
                    {on && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-foreground" />}
                    <span className="min-w-0 flex-1 truncate">{p.pack.title}</span>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {p.pack.type}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-4 space-y-3">
          <div>
            <FieldLabel hint="Signed into the board auth message. Keep under 2000 chars.">
              Question
            </FieldLabel>
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={2}
              disabled={running}
              className="resize-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {(["auto", "fast", "live", "fallback"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs capitalize",
                  mode === m ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                {m}
              </button>
            ))}
            <Hint text="Auto tries fast compute, then live swarm, then offline fallback." />
          </div>
          <Button onClick={() => void runBoard()} disabled={running || !isConnected}>
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {running ? "Debating…" : "Convene"}
          </Button>
          {files.length > 0 && packs.length === 0 && !loadingPacks && (
            <p className="text-[11px] text-muted-foreground">
              Vault has files that are not evidence packs — re-ingest via wallet/CSV/paste.
            </p>
          )}
        </div>
      </Panel>

      {session && (
        <Panel pad={false}>
          <div className="flex items-center justify-between gap-3 px-5 py-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Transcript</span>
              <span className={cn("text-xs font-medium uppercase", verdictTone(session.consensus.verdict))}>
                {session.consensus.verdict}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {session.computeMode}
              </span>
            </div>
            <Button size="sm" variant="outline" onClick={() => void saveAndBind()} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {hasAgent ? "Save & bind" : "Save"}
            </Button>
          </div>

          {session.guard && <GuardStrip guard={session.guard} />}

          <div className="divide-y divide-border">
            {session.turns.map((turn) => (
              <div key={turn.role} className="px-5 py-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <RoleIcon role={turn.role} />
                    {turn.name}
                  </div>
                  <span className={cn("text-[10px] uppercase", verdictTone(turn.stance))}>
                    {turn.stance}
                  </span>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">{turn.argument}</p>
              </div>
            ))}
          </div>

          <div className="px-5 py-4 bg-muted/30 space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium">
              <Gavel className="h-3.5 w-3.5" />
              Consensus
              <span className="text-muted-foreground font-normal">
                {Math.round(session.consensus.confidence * 100)}%
              </span>
            </div>
            <p className="text-sm leading-relaxed">{session.consensus.summary}</p>
            {savedRoot && (
              <p className="text-[10px] font-mono text-muted-foreground">
                {savedRoot.slice(0, 20)}…{boundTx ? ` · bound` : ""}
              </p>
            )}
          </div>
        </Panel>
      )}

      <TradeDesk session={session} />
    </div>
  );
}

function GuardStrip({
  guard,
}: {
  guard: NonNullable<BoardSession["guard"]>;
}) {
  const tone =
    guard.status === "pass"
      ? "bg-[var(--success)]/10 text-[var(--success)]"
      : guard.status === "block"
        ? "bg-[var(--danger)]/10 text-[var(--danger)]"
        : "bg-amber-500/10 text-amber-500";

  return (
    <div className={cn("mx-5 mb-3 rounded-md px-3 py-2.5 text-xs", tone)}>
      <div className="flex items-center gap-1.5 font-medium">
        {guard.status === "block" ? (
          <Ban className="h-3.5 w-3.5" />
        ) : guard.status === "review" ? (
          <ShieldAlert className="h-3.5 w-3.5" />
        ) : (
          <ShieldCheck className="h-3.5 w-3.5" />
        )}
        Firewall · {guard.status}
        <Hint text={guard.reasons.join(" · ") || "Sealed execution gate"} />
      </div>
    </div>
  );
}
