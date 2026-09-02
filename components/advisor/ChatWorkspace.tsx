"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAccount, useSignMessage } from "wagmi";
import { ArrowUp, Loader2, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatReadinessPanel } from "@/components/advisor/ChatReadinessPanel";
import { useComputeLedgerContext } from "@/components/vault/ComputeLedgerContext";
import { useUserFiles } from "@/hooks/useUserFiles";
import { usefetchFileContent } from "@/hooks/useFileContent";
import { useAgenticId } from "@/hooks/useAgenticId";
import type { VaultEvidence } from "@/lib/evidence";
import { loadAskableEvidence } from "@/lib/vault/askableContext";
import {
  countAgentKnowledge,
  resolveChatReadiness,
} from "@/lib/chat/chatReadiness";
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

export function ChatWorkspace() {
  const { isConnected, address, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { files, refetch } = useUserFiles();
  const { fetchFileContent } = usefetchFileContent();
  const { agent } = useAgenticId();
  const { readiness, loading: ledgerLoading } = useComputeLedgerContext();

  const [evidence, setEvidence] = useState<VaultEvidence[]>([]);
  const [knowledgeMeta, setKnowledgeMeta] = useState({ structured: 0, indexed: 0 });
  const [loadingEvidence, setLoadingEvidence] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const knowledgeFileCount = useMemo(() => countAgentKnowledge(files), [files]);

  const chatReadiness = useMemo(
    () =>
      resolveChatReadiness({
        isConnected,
        loadingEvidence: loadingEvidence || ledgerLoading,
        totalFiles: files.length,
        knowledgeFiles: knowledgeFileCount,
        askableCount: evidence.length,
        canCompute: readiness.canCompute,
        hasLedger: readiness.hasLedger,
        hasBalance: readiness.hasBalance,
        hasFundedProvider: readiness.hasFundedProvider,
      }),
    [
      evidence.length,
      files.length,
      isConnected,
      knowledgeFileCount,
      ledgerLoading,
      loadingEvidence,
      readiness.canCompute,
      readiness.hasBalance,
      readiness.hasFundedProvider,
      readiness.hasLedger,
    ]
  );

  const loadEvidence = useCallback(async () => {
    if (!isConnected) {
      setEvidence([]);
      setKnowledgeMeta({ structured: 0, indexed: 0 });
      return;
    }
    setLoadingEvidence(true);
    try {
      const list = await refetch({ silent: true });
      const result = await loadAskableEvidence({
        files: list,
        fetchContent: fetchFileContent,
        limit: 16,
      });
      setEvidence(result.evidence);
      setKnowledgeMeta({
        structured: result.structuredCount,
        indexed: result.indexedCount,
      });
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

    if (!chatReadiness.canSend) {
      toast.error(chatReadiness.title);
      return;
    }
    if (!address) return;

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
          chainId,
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
          content: `I couldn't complete that. ${msg}`,
        },
      ]);
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const empty = messages.length === 0;

  const inputPlaceholder = !chatReadiness.canSend
    ? chatReadiness.blocker === "disconnected"
      ? "Connect wallet to chat…"
      : chatReadiness.blocker === "no_files"
        ? "Add vault files first…"
        : chatReadiness.blocker === "no_knowledge"
          ? "Run Insights to build agent knowledge…"
          : chatReadiness.blocker === "compute"
            ? "Finish compute setup to chat…"
            : chatReadiness.blocker === "loading"
              ? "Loading agent knowledge…"
              : "Fix vault loading to chat…"
    : "Ask about your vault…";

  return (
    <div className="flex h-[calc(100vh-3.5rem-2rem)] min-h-[28rem] flex-col gap-3 pb-1">
      <header className="flex shrink-0 flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold sm:text-3xl">
            Talk to your vault
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Chat works from agent knowledge. Fund compute, run
            Insights to categorize and summarize, then ask questions grounded in
            what your agent actually understands.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {agent ? (
            <Link
              href="/dashboard/agent/mint"
              className="rounded-full bg-[color-mix(in_srgb,var(--brand)_12%,transparent)] px-3 py-1.5 text-xs font-medium text-[var(--brand)]"
            >
              Agentic #{agent.tokenId.toString()}
            </Link>
          ) : isConnected ? (
            <Button asChild size="sm" variant="outline" className="rounded-full">
              <Link href="/dashboard/agent/mint">Mint Agentic ID</Link>
            </Button>
          ) : null}
          {chatReadiness.canSend ? (
            <span className="rounded-full bg-[color-mix(in_srgb,var(--success)_12%,transparent)] px-3 py-1.5 text-xs font-medium text-[var(--success)]">
              {evidence.length} file{evidence.length === 1 ? "" : "s"} ready
            </span>
          ) : null}
        </div>
      </header>

      <div className=" relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {!chatReadiness.canSend && empty ? (
          <div className="shrink-0 border-b border-border/40 p-4 sm:px-6">
            <ChatReadinessPanel
              readiness={chatReadiness}
              onRefresh={() => void loadEvidence()}
              refreshing={loadingEvidence || ledgerLoading}
            />
          </div>
        ) : null}

        <div className="brand-scroll flex-1 overflow-y-auto px-4 py-6 sm:px-8">
          {empty ? (
            <div className="mx-auto flex max-w-2xl flex-col items-center pt-4 text-center sm:pt-8">
              {chatReadiness.canSend ? (
                <>
                  <h2 className="text-xl font-semibold sm:text-2xl">
                    What do you want to know?
                  </h2>
                  <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    {evidence.length} knowledge file{evidence.length === 1 ? "" : "s"}{" "}
                    loaded
                    {knowledgeMeta.indexed > 0
                      ? ` · ${knowledgeMeta.indexed} from Insights`
                      : ""}
                    {knowledgeMeta.structured > 0
                      ? ` · ${knowledgeMeta.structured} structured`
                      : ""}
                    . Pick a prompt or type your own.
                  </p>
                  <div className="mt-8 grid w-full gap-2 sm:grid-cols-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => void send(s)}
                        disabled={sending}
                        className="rounded-2xl bg-muted/50 px-4 py-3 text-left text-sm transition-colors hover:bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] disabled:opacity-40"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-semibold sm:text-2xl">
                    Almost ready to chat
                  </h2>
                  <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    Complete the steps above — wallet, vault files, agent
                    knowledge, and compute — then come back here to ask questions.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    <Button asChild variant="outline" className="rounded-full">
                      <Link href="/dashboard/vault/my-files">Vault</Link>
                    </Button>
                    <Button asChild variant="outline" className="rounded-full">
                      <Link href="/dashboard/vault/insights">Insights desk</Link>
                    </Button>
                  </div>
                </>
              )}
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
                      <p className="mt-2 text-[10px] opacity-60">{m.meta}</p>
                    ) : null}
                  </div>
                </div>
              ))}
              {sending ? (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-3xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Thinking with your agent knowledge…
                  </div>
                </div>
              ) : null}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-border/50 px-3 py-3 sm:px-6 sm:py-4">
          <div className="mx-auto max-w-2xl space-y-2">
            {!chatReadiness.canSend && !empty ? (
              <ChatReadinessPanel
                readiness={chatReadiness}
                compact
                onRefresh={() => void loadEvidence()}
                refreshing={loadingEvidence || ledgerLoading}
              />
            ) : null}

            <div className="flex items-end gap-2 rounded-[1.5rem] bg-muted/50 px-3 py-2 ring-1 ring-border/60 focus-within:ring-[var(--brand)]/40">
              <Link
                href="/dashboard/vault/my-files"
                className="mb-1.5 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                title="Manage vault files"
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
                placeholder={inputPlaceholder}
                disabled={sending}
                className="max-h-32 min-h-[40px] flex-1 resize-none bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground"
              />
              <Button
                size="icon"
                className="mb-1 size-9 shrink-0 rounded-full"
                disabled={sending || !input.trim() || !chatReadiness.canSend}
                onClick={() => void send(input)}
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUp className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-center text-[10px] text-muted-foreground">
              {chatReadiness.canSend
                ? "Vault Q&A · trading lives under Trading & Finance"
                : chatReadiness.title}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
