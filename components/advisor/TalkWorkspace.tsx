"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAccount, useSignMessage } from "wagmi";
import { ArrowUp, Loader2, Paperclip, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserFiles } from "@/hooks/useUserFiles";
import { usefetchFileContent } from "@/hooks/useFileContent";
import { useAgenticId } from "@/hooks/useAgenticId";
import { isEvidenceCategory, type VaultEvidence } from "@/lib/evidence";
import type { BoardSession } from "@/lib/board";
import { boardAuthMessage } from "@/lib/boardAuthMessage";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const SUGGESTIONS = [
  "Where did I spend the most?",
  "Summarize my wallet activity",
  "Any unusual transactions I should review?",
  "What recurring spends stand out?",
];

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  meta?: string;
};

function parseEvidence(raw: string): VaultEvidence | null {
  try {
    const parsed = JSON.parse(raw) as VaultEvidence;
    if (parsed?.id && parsed?.type && Array.isArray(parsed.facts)) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

function formatAssistant(session: BoardSession): string {
  const lines = [
    session.consensus.summary,
    "",
    ...session.turns.map(
      (t) => `**${t.name}** (${t.stance}): ${t.argument}`
    ),
  ];
  if (session.consensus.actions?.length) {
    lines.push("", "Suggested next steps:");
    for (const a of session.consensus.actions) lines.push(`• ${a}`);
  }
  return lines.join("\n").trim();
}

function renderContent(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("**") && line.includes("**")) {
      const html = line.replace(/\*\*(.+?)\*\*/g, "$1");
      return (
        <p key={i} className="mb-2 text-sm leading-relaxed last:mb-0">
          <span className="font-semibold">{html.split(":")[0]}</span>
          {html.includes(":") ? `:${html.slice(html.indexOf(":") + 1)}` : ""}
        </p>
      );
    }
    if (line.startsWith("• ")) {
      return (
        <p key={i} className="mb-1 pl-2 text-sm leading-relaxed text-muted-foreground">
          {line}
        </p>
      );
    }
    if (!line.trim()) return <div key={i} className="h-2" />;
    return (
      <p key={i} className="mb-2 text-sm leading-relaxed last:mb-0">
        {line}
      </p>
    );
  });
}

export function TalkWorkspace() {
  const { isConnected, address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { refetch } = useUserFiles();
  const { fetchFileContent } = usefetchFileContent();
  const { agent } = useAgenticId();

  const [evidence, setEvidence] = useState<VaultEvidence[]>([]);
  const [loadingEvidence, setLoadingEvidence] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadEvidence = useCallback(async () => {
    if (!isConnected) {
      setEvidence([]);
      return;
    }
    setLoadingEvidence(true);
    try {
      const list = await refetch({ silent: true });
      const packs: VaultEvidence[] = [];
      for (const f of list
        .filter((x) => isEvidenceCategory(x.category))
        .slice(0, 12)) {
        if (f.category === "evidence:board" || f.category === "evidence:trade")
          continue;
        try {
          const pack = parseEvidence(await fetchFileContent(f.rootHash));
          if (pack) packs.push(pack);
        } catch {
          /* skip */
        }
      }
      setEvidence(packs);
    } finally {
      setLoadingEvidence(false);
    }
  }, [fetchFileContent, isConnected, refetch]);

  useEffect(() => {
    void loadEvidence();
  }, [loadEvidence]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || sending) return;
    if (!isConnected || !address) {
      toast.error("Connect wallet to chat with your vault");
      return;
    }
    if (evidence.length === 0) {
      toast.error("Add evidence in Vault first");
      return;
    }

    setInput("");
    setMessages((m) => [
      ...m,
      { id: `u_${Date.now()}`, role: "user", content: question },
    ]);
    setSending(true);

    try {
      const timestamp = Date.now();
      const message = boardAuthMessage({ wallet: address, timestamp, question });
      const signature = await signMessageAsync({ message });
      const res = await fetch("/api/boardSession", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          evidence,
          mode: "auto",
          agentTokenId: agent?.tokenId.toString(),
          wallet: address,
          timestamp,
          signature,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      const session = data.session as BoardSession;
      setMessages((m) => [
        ...m,
        {
          id: `a_${Date.now()}`,
          role: "assistant",
          content: formatAssistant(session),
          meta: `${session.consensus.verdict} · ${Math.round(session.consensus.confidence * 100)}% · ${session.computeMode}`,
        },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed";
      toast.error(msg);
      setMessages((m) => [
        ...m,
        {
          id: `a_err_${Date.now()}`,
          role: "assistant",
          content: `I couldn’t complete that. ${msg}`,
        },
      ]);
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const empty = messages.length === 0;

  return (
    <div className="flex h-[calc(100vh-3.5rem-2rem)] min-h-[28rem] flex-col">
      {/* Context strip */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">
            Talk to your data
          </p>
          <p className="text-xs text-muted-foreground">
            Advisory only — grounded in your vault evidence
            {loadingEvidence
              ? " · loading…"
              : ` · ${evidence.length} pack${evidence.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {evidence.length === 0 && isConnected ? (
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/vault/my-files">Add evidence</Link>
            </Button>
          ) : null}
          <Button asChild size="sm" variant="ghost">
            <Link href="/dashboard/advisor/trade">Take a trade →</Link>
          </Button>
        </div>
      </div>

      {/* Thread */}
      <div className="bento relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="brand-scroll flex-1 overflow-y-auto px-4 py-6 sm:px-8">
          {empty ? (
            <div className="mx-auto flex max-w-2xl flex-col items-center justify-center pt-10 text-center sm:pt-16">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--brand)_14%,transparent)]">
                <Sparkles className="h-5 w-5 text-[var(--brand)]" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Ask anything about your vault
              </h1>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Spend patterns, wallet activity, anomalies — Concierge answers
                from your evidence only. No trades from this chat.
              </p>
              <div className="mt-8 grid w-full gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void send(s)}
                    disabled={!isConnected || evidence.length === 0 || sending}
                    className="rounded-2xl bg-muted/50 px-4 py-3 text-left text-sm transition-colors hover:bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] disabled:opacity-40"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-2xl space-y-6">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex",
                    m.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-3xl px-4 py-3",
                      m.role === "user"
                        ? "bg-[var(--brand)] text-white"
                        : "bg-muted/60 text-foreground"
                    )}
                  >
                    {m.role === "assistant" ? (
                      <div>{renderContent(m.content)}</div>
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {m.content}
                      </p>
                    )}
                    {m.meta ? (
                      <p className="mt-2 text-[10px] uppercase tracking-wide opacity-60">
                        {m.meta}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
              {sending ? (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-3xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Thinking with your evidence…
                  </div>
                </div>
              ) : null}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="shrink-0 border-t border-border/50 px-3 py-3 sm:px-6 sm:py-4">
          <div className="mx-auto max-w-2xl">
            <div className="flex items-end gap-2 rounded-[1.5rem] bg-muted/50 px-3 py-2 ring-1 ring-border/60 focus-within:ring-[var(--brand)]/40">
              <Link
                href="/dashboard/vault/my-files"
                className="mb-1.5 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                title="Manage evidence"
              >
                <Paperclip className="h-4 w-4" />
              </Link>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send(input);
                  }
                }}
                rows={1}
                placeholder={
                  !isConnected
                    ? "Connect wallet to chat…"
                    : evidence.length === 0
                      ? "Add vault evidence to start…"
                      : "Message Concierge…"
                }
                disabled={sending}
                className="max-h-32 min-h-[40px] flex-1 resize-none bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground"
              />
              <Button
                size="icon"
                className="mb-1 size-9 shrink-0 rounded-full"
                disabled={
                  sending || !input.trim() || !isConnected || evidence.length === 0
                }
                onClick={() => void send(input)}
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUp className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              Answers use selected vault packs. For swaps, use Take a trade.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
