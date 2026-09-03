"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useAccount, useChainId, useSignMessage } from "wagmi";
import {
  ArrowUp,
  Lightbulb,
  Loader2,
  MessageCircle,
  Paperclip,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatReadinessPanel } from "@/components/advisor/ChatReadinessPanel";
import {
  AttachmentChip,
  ChatAttachmentControls,
  useChatAttachments,
} from "@/components/advisor/ChatAttachments";
import { ChatComputeControls } from "@/components/advisor/ChatComputeControls";
import type { ComputeQuota } from "@/hooks/useComputeQuota";
import { useComputeLedgerContext } from "@/components/vault/ComputeLedgerContext";
import { useUserFiles, type VaultFile } from "@/hooks/useUserFiles";
import { usefetchFileContent } from "@/hooks/useFileContent";
import { useAgenticId } from "@/hooks/useAgenticId";
import type { VaultEvidence } from "@/lib/evidence";
import { loadAskableEvidence } from "@/lib/vault/askableContext";
import {
  countAgentKnowledge,
  resolveChatReadiness,
  type ChatIntent,
} from "@/lib/chat/chatReadiness";
import type { BoardSession } from "@/lib/board";
import { boardAuthMessage } from "@/lib/boardAuthMessage";
import { readCachedPersonality } from "@/lib/agentPersonality";
import { AUTO_MODEL_ID } from "@/lib/computeModels";
import { useComputeQuota } from "@/hooks/useComputeQuota";
import {
  buildVaultFallbackQuestions,
  buildVaultTipContext,
} from "@/lib/chat/vaultSuggestions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";

const APP_ICON = "/circle-conc-new.png";
const CHAT_MODEL_STORAGE_KEY = "concierge.chat.model";

type VaultQuestion = {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  prompt: string;
};

function withQuestionIds(
  questions: Omit<VaultQuestion, "id">[]
): VaultQuestion[] {
  const seenPrompts = new Set<string>();
  return questions.map((q, index) => {
    let id = q.prompt.trim() || `question-${index}`;
    if (seenPrompts.has(id)) {
      id = `${id}-${index}`;
    }
    seenPrompts.add(id);
    return { ...q, id };
  });
}

function toVaultQuestions(
  suggestions: ReturnType<typeof buildVaultFallbackQuestions>
): VaultQuestion[] {
  return suggestions.map((s) => ({
    id: s.id,
    icon: s.icon,
    title: s.title,
    description: s.description,
    prompt: s.prompt,
  }));
}

const CASUAL_SUGGESTIONS: VaultQuestion[] = withQuestionIds([
  {
    icon: MessageCircle,
    title: "Intro",
    description: "Meet your Concierge",
    prompt: "Who are you and what can you help with?",
  },
  {
    icon: Sparkles,
    title: "Briefing",
    description: "Start the day",
    prompt: "Give me a quick briefing for today.",
  },
  {
    icon: Lightbulb,
    title: "Focus",
    description: "Prioritize the week",
    prompt: "What should I focus on this week?",
  },
]);

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  meta?: string;
  attachments?: { label: string }[];
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
        <p
          key={i}
          className="mb-1 pl-2 text-sm leading-relaxed text-muted-foreground"
        >
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

function greetingName(
  address: string | undefined,
  agentTokenId: bigint | undefined,
  chainId: number
) {
  if (agentTokenId != null) {
    const cached = readCachedPersonality(chainId, agentTokenId);
    if (cached.displayName?.trim()) return cached.displayName.trim();
  }
  if (address) return `${address.slice(0, 6)}…${address.slice(-4)}`;
  return null;
}

function parseIntent(raw: string | null): ChatIntent {
  if (raw === "vault") return "vault";
  return "casual";
}

export function ChatWorkspace() {
  const searchParams = useSearchParams();
  const chainId = useChainId();
  const { isConnected, address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { files, refetch } = useUserFiles();
  const { fetchFileContent } = usefetchFileContent();
  const { agent } = useAgenticId();
  const { readiness, loading: operatorLoading, ledgerLoading } =
    useComputeLedgerContext();
  const {
    quota,
    loading: quotaLoading,
    refresh: refreshQuota,
  } = useComputeQuota(readiness.operatorSubsidized);

  const [selectedModel, setSelectedModel] = useState(AUTO_MODEL_ID);

  const [intent, setIntent] = useState<ChatIntent>(() =>
    parseIntent(searchParams.get("intent"))
  );
  const [evidence, setEvidence] = useState<VaultEvidence[]>([]);
  const [knowledgeMeta, setKnowledgeMeta] = useState({
    structured: 0,
    indexed: 0,
  });
  const [loadingEvidence, setLoadingEvidence] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [tipsLoading, setTipsLoading] = useState(false);
  const [tipSummary, setTipSummary] = useState<string | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<VaultQuestion[]>(
    []
  );
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const tipsFetchedRef = useRef(false);

  useEffect(() => {
    setIntent(parseIntent(searchParams.get("intent")));
  }, [searchParams]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHAT_MODEL_STORAGE_KEY);
      if (saved) setSelectedModel(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const handleModelChange = useCallback((model: string) => {
    setSelectedModel(model);
    try {
      localStorage.setItem(CHAT_MODEL_STORAGE_KEY, model);
    } catch {
      /* ignore */
    }
  }, []);

  const {
    attachments,
    uploading: attachmentsUploading,
    readyEvidence,
    deviceInputRef,
    removeAttachment,
    clearAttachments,
    attachFromVault,
    attachFromDevice,
  } = useChatAttachments({
    files,
    fetchFileContent,
    onVaultChange: () => {
      void refetch({ silent: true });
    },
  });

  const knowledgeFileCount = useMemo(() => countAgentKnowledge(files), [files]);

  const computeChecking =
    (operatorLoading || ledgerLoading) &&
    !readiness.canCompute &&
    !readiness.operatorSubsidized;

  const readinessInput = useMemo(
    () => ({
      isConnected,
      loadingEvidence: intent === "vault" && loadingEvidence,
      computeChecking,
      totalFiles: files.length,
      knowledgeFiles: knowledgeFileCount,
      askableCount: evidence.length,
      canCompute: readiness.canCompute,
      operatorSubsidized: readiness.operatorSubsidized,
      hasLedger: readiness.hasLedger,
      hasBalance: readiness.hasBalance,
      hasFundedProvider: readiness.hasFundedProvider,
    }),
    [
      computeChecking,
      evidence.length,
      files.length,
      intent,
      isConnected,
      knowledgeFileCount,
      loadingEvidence,
      readiness.canCompute,
      readiness.operatorSubsidized,
      readiness.hasBalance,
      readiness.hasFundedProvider,
      readiness.hasLedger,
    ]
  );

  const chatReadiness = useMemo(
    () => resolveChatReadiness({ intent, ...readinessInput }),
    [intent, readinessInput]
  );

  const casualReadiness = useMemo(
    () => resolveChatReadiness({ intent: "casual", ...readinessInput }),
    [readinessInput]
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

  const loadVaultTips = useCallback(
    async (force = false) => {
      if (intent !== "vault") return;
      if (!isConnected || !address || !readiness.canCompute) return;

      setTipsLoading(true);
      setSuggestedQuestions([]);
      setTipSummary(null);

      try {
        const synced = await refetch({ silent: true });
        const vaultContext = await buildVaultTipContext(synced, fetchFileContent);
        const res = await fetch("/api/chatTips", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vaultContext, wallet: address }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Tips failed");

        const questions = withQuestionIds(
          (json.questions ?? []).map(
            (q: { title: string; description: string; prompt: string }) => ({
              icon: Lightbulb,
              title: q.title,
              description: q.description,
              prompt: q.prompt,
            })
          )
        );
        setTipSummary(json.summary ?? null);
        setSuggestedQuestions(
          questions.length
            ? questions
            : toVaultQuestions(buildVaultFallbackQuestions(synced))
        );
        tipsFetchedRef.current = true;
      } catch (err: unknown) {
        if (force) {
          toast.error(err instanceof Error ? err.message : "Tips failed");
        }
        setSuggestedQuestions(
          toVaultQuestions(buildVaultFallbackQuestions(files))
        );
      } finally {
        setTipsLoading(false);
      }
    },
    [address, fetchFileContent, files, intent, isConnected, readiness.canCompute, refetch]
  );

  useEffect(() => {
    if (intent === "casual") {
      setSuggestedQuestions(CASUAL_SUGGESTIONS);
      setTipSummary(null);
      tipsFetchedRef.current = true;
      return;
    }
    tipsFetchedRef.current = false;
    setSuggestedQuestions([]);
    setTipSummary(null);
  }, [intent]);

  useEffect(() => {
    if (intent !== "vault" || !isConnected) {
      if (!isConnected) {
        setEvidence([]);
        setKnowledgeMeta({ structured: 0, indexed: 0 });
      }
      return;
    }
    void loadEvidence();
  }, [intent, isConnected, loadEvidence]);

  useEffect(() => {
    if (
      intent === "vault" &&
      chatReadiness.canSend &&
      !tipsFetchedRef.current &&
      !tipsLoading
    ) {
      void loadVaultTips();
    }
  }, [chatReadiness.canSend, intent, loadVaultTips, tipsLoading]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const name = greetingName(address, agent?.tokenId, chainId);
  const empty = messages.length === 0;

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || sending || attachmentsUploading) return;

    if (!chatReadiness.canSend) {
      toast.error(chatReadiness.title);
      return;
    }
    if (!address) return;

    const attachedLabels = attachments
      .filter((a) => a.status === "ready")
      .map((a) => ({ label: a.label }));
    const messageEvidence = (() => {
      if (intent === "casual") {
        return readyEvidence.length ? readyEvidence : [];
      }
      if (!readyEvidence.length) return evidence;
      const seen = new Set<string>();
      const merged: typeof evidence = [];
      for (const pack of [...readyEvidence, ...evidence]) {
        if (seen.has(pack.id)) continue;
        seen.add(pack.id);
        merged.push(pack);
      }
      return merged;
    })();

    setInput("");
    setMessages((m) => [
      ...m,
      {
        id: `u_${Date.now()}`,
        role: "user",
        content: question,
        attachments: attachedLabels.length ? attachedLabels : undefined,
      },
    ]);
    clearAttachments();
    setSending(true);

    try {
      const timestamp = Date.now();

      if (intent === "casual") {
        const authMessage = boardAuthMessage({
          wallet: address,
          timestamp,
          question,
        });
        const signature = await signMessageAsync({ message: authMessage });
        const personality =
          agent?.tokenId != null
            ? readCachedPersonality(chainId, agent.tokenId)
            : null;

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: question,
            evidence: messageEvidence,
            model: selectedModel,
            displayName: personality?.displayName,
            bio: personality?.bio,
            chainId,
            wallet: address,
            timestamp,
            signature,
            mode: "fast",
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Request failed");

        setMessages((m) => [
          ...m,
          {
            id: `a_${Date.now()}`,
            role: "assistant",
            content: String(data.reply ?? "").trim() || "…",
            meta: `${data.modelLabel ?? "Auto"} · casual`,
          },
        ]);
      } else {
        const modeHint =
          "\n\n[Mode: answer from the user's vault knowledge.]";
        const fullQuestion = `${question}${modeHint}`;
        const authMessage = boardAuthMessage({
          wallet: address,
          timestamp,
          question: fullQuestion,
        });
        const signature = await signMessageAsync({ message: authMessage });
        const res = await fetch("/api/boardSession", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: fullQuestion,
            evidence: messageEvidence,
            mode: "auto",
            model: selectedModel,
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
      }

      void refreshQuota();
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

  const inputPlaceholder = !chatReadiness.canSend
    ? chatReadiness.blocker === "disconnected"
      ? "Connect wallet to start…"
      : chatReadiness.blocker === "no_files"
        ? intent === "vault"
          ? "Add vault files first…"
          : "Finish setup — or switch to Casual…"
        : chatReadiness.blocker === "no_knowledge"
          ? intent === "vault"
            ? "Feed files in Knowledge base…"
            : "Finish setup — or switch to Casual…"
          : chatReadiness.blocker === "compute"
            ? "Finish compute setup…"
            : chatReadiness.blocker === "loading"
              ? intent === "vault"
                ? "Loading vault knowledge…"
                : "Checking compute…"
              : intent === "vault"
                ? "Fix vault loading — or switch to Casual…"
                : "Fix setup…"
    : intent === "casual"
      ? "Say anything…"
      : "Ask what your vault knows…";

  return (
    <div className="relative flex h-[calc(100vh-3.5rem-2rem)] min-h-[28rem] flex-col overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-60"
        aria-hidden
      >
        <div className="absolute left-1/2 top-[12%] h-64 w-64 -translate-x-1/2 rounded-full bg-[color-mix(in_srgb,var(--brand)_18%,transparent)] blur-3xl" />
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 px-1 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          {chatReadiness.canSend && intent === "vault" ? (
            <span className="rounded-full bg-muted/70 px-3 py-1 text-[11px] font-medium tabular-nums text-muted-foreground">
              {evidence.length} file{evidence.length === 1 ? "" : "s"} in context
            </span>
          ) : chatReadiness.canSend && intent === "casual" ? (
            <span className="rounded-full bg-muted/70 px-3 py-1 text-[11px] font-medium text-muted-foreground">
              {readiness.operatorSubsidized ? "0G Compute" : "Casual"}
            </span>
          ) : null}
          {agent ? (
            <Link
              href="/dashboard/agent/mint"
              className="rounded-full bg-[color-mix(in_srgb,var(--brand)_12%,transparent)] px-3 py-1.5 text-xs font-medium text-[var(--brand)]"
            >
              Agentic #{agent.tokenId.toString()}
            </Link>
          ) : isConnected ? (
            <Button asChild size="sm" variant="outline" className="h-8 rounded-full text-xs">
              <Link href="/dashboard/agent/mint">Mint Agentic ID</Link>
            </Button>
          ) : null}
          <Button asChild size="sm" variant="ghost" className="h-8 rounded-full text-xs">
            <Link href="/dashboard/vault">Vault</Link>
          </Button>
        </div>
      </div>

      {empty ? (
        <div className="brand-scroll flex flex-1 flex-col items-center overflow-y-auto px-4 pb-8 pt-6 sm:px-6">
          <AppIconHero />

          <p className="text-sm font-medium text-[var(--brand)]">
            {name ? `Hello, ${name}` : "Hello"}
          </p>
          <h1 className="mt-1 max-w-lg text-center text-2xl font-semibold tracking-tight sm:text-3xl">
            How can I assist you today?
          </h1>
          <p className="mt-2 max-w-md text-center text-sm leading-relaxed text-muted-foreground">
            {intent === "casual"
              ? "Chat with Concierge."
              : "Ask what your vault knows."}
          </p>

          {!chatReadiness.canSend ? (
            <div className="mt-6 w-full max-w-2xl space-y-3">
              <ChatReadinessPanel
                readiness={chatReadiness}
                onRefresh={
                  chatReadiness.blocker === "loading" ||
                  chatReadiness.blocker === "load_failed"
                    ? () => void loadEvidence()
                    : undefined
                }
                refreshing={loadingEvidence}
              />
              {chatReadiness.blocker === "loading" &&
              intent === "vault" &&
              casualReadiness.canSend ? (
                <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
                  <p className="text-center text-xs text-muted-foreground">
                    Don&apos;t want to wait?
                  </p>
                  <Button
                    type="button"
                    className="rounded-full"
                    onClick={() => setIntent("casual")}
                  >
                    Chat in Casual mode
                  </Button>
                </div>
              ) : intent === "vault" &&
                !chatReadiness.canSend &&
                casualReadiness.canSend ? (
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => setIntent("casual")}
                  >
                    Switch to Casual
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-8 w-full max-w-2xl">
            <ChatInputCard
              input={input}
              setInput={setInput}
              placeholder={inputPlaceholder}
              sending={sending}
              canSend={chatReadiness.canSend}
              attachmentsUploading={attachmentsUploading}
              onSend={() => void send(input)}
              textareaRef={textareaRef}
              tipsLoading={tipsLoading}
              onTips={() => void loadVaultTips(true)}
              intent={intent}
              files={files}
              attachments={attachments}
              deviceInputRef={deviceInputRef}
              onDeviceSelect={(list) => void attachFromDevice(list)}
              onVaultAttach={(hashes) => void attachFromVault(hashes)}
              onRemoveAttachment={removeAttachment}
              onIntentChange={setIntent}
              selectedModel={selectedModel}
              onModelChange={handleModelChange}
              quota={quota}
              quotaLoading={quotaLoading}
            />
          </div>

          {chatReadiness.canSend ? (
            <>
              <div className="mt-8 flex w-full max-w-3xl items-center justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {intent === "casual" ? "Try asking" : "Suggested questions"}
                </p>
                {intent === "vault" && tipsLoading ? (
                  <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Personalizing suggestions…
                  </span>
                ) : intent === "vault" && tipSummary ? (
                  <p className="max-w-sm truncate text-[11px] text-muted-foreground">
                    {tipSummary}
                  </p>
                ) : null}
              </div>
              <div className="mt-3 grid w-full max-w-3xl gap-3 sm:grid-cols-3">
                {(intent === "vault" && tipsLoading) ||
                (intent === "vault" && suggestedQuestions.length === 0)
                  ? [1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-28 animate-pulse rounded-2xl bg-muted/40"
                      />
                    ))
                  : suggestedQuestions.map((q) => (
                      <QuestionCard
                        key={q.id}
                        question={q}
                        disabled={sending}
                        onSelect={() => void send(q.prompt)}
                      />
                    ))}
              </div>
              {intent === "vault" && knowledgeMeta.indexed > 0 ? (
                <p className="mt-4 text-center text-[11px] text-muted-foreground">
                  {evidence.length} knowledge file{evidence.length === 1 ? "" : "s"}
                  {knowledgeMeta.indexed > 0
                    ? ` · ${knowledgeMeta.indexed} from knowledge base`
                    : ""}
                </p>
              ) : null}
            </>
          ) : (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {intent === "vault" && casualReadiness.canSend ? (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setIntent("casual")}
                >
                  Try Casual
                </Button>
              ) : null}
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/dashboard/vault/upload">Open Vault</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/dashboard/knowledge/feed">Knowledge base</Link>
              </Button>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="brand-scroll flex-1 overflow-y-auto px-4 py-6 sm:px-8">
            <div className="mx-auto max-w-2xl space-y-8">
              {messages.map((m) => (
                <MessageBlock key={m.id} message={m} />
              ))}
              {sending ? (
                <div className="flex items-start gap-3">
                  <AssistantAvatar />
                  <div className="flex items-center gap-2 rounded-2xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {intent === "casual"
                      ? "Thinking…"
                      : "Reading your vault…"}
                  </div>
                </div>
              ) : null}
              <div ref={bottomRef} />
            </div>
          </div>

          <div className="shrink-0 border-t border-border/40 bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] px-4 py-4 backdrop-blur-sm sm:px-6">
            <div className="mx-auto max-w-2xl space-y-2">
              {!chatReadiness.canSend ? (
                <ChatReadinessPanel
                  readiness={chatReadiness}
                  compact
                  onRefresh={() => void loadEvidence()}
                  refreshing={loadingEvidence}
                />
              ) : null}
              <ChatInputCard
                input={input}
                setInput={setInput}
                placeholder={inputPlaceholder}
                sending={sending}
                canSend={chatReadiness.canSend}
                attachmentsUploading={attachmentsUploading}
                onSend={() => void send(input)}
                textareaRef={textareaRef}
                tipsLoading={tipsLoading}
                onTips={() => void loadVaultTips(true)}
                intent={intent}
                files={files}
                attachments={attachments}
                deviceInputRef={deviceInputRef}
                onDeviceSelect={(list) => void attachFromDevice(list)}
                onVaultAttach={(hashes) => void attachFromVault(hashes)}
                onRemoveAttachment={removeAttachment}
                onIntentChange={setIntent}
                selectedModel={selectedModel}
                onModelChange={handleModelChange}
                quota={quota}
                quotaLoading={quotaLoading}
                compact
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function IntentToggle({
  intent,
  onChange,
  inline,
}: {
  intent: ChatIntent;
  onChange: (intent: ChatIntent) => void;
  inline?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex gap-0.5 rounded-full bg-muted/50 p-0.5",
        !inline && "mt-5"
      )}
    >
      {(
        [
          { id: "casual" as const, label: "Casual" },
          { id: "vault" as const, label: "Your data" },
        ] as const
      ).map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={cn(
            "rounded-full font-semibold transition-colors",
            inline ? "px-2.5 py-1 text-[10px]" : "px-4 py-1.5 text-xs",
            intent === opt.id
              ? "bg-[var(--surface)] text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function AppIconHero() {
  return (
    <div className="relative mb-6 flex h-[4.5rem] w-[4.5rem] items-center justify-center sm:h-20 sm:w-20">
      <div
        className="absolute inset-0 scale-150 rounded-full opacity-80"
     
        aria-hidden
      />
      <Image
        src={APP_ICON}
        alt="Concierge"
        width={80}
        height={80}
        priority
        className="relative h-full w-full object-contain"
      />
    </div>
  );
}

function AssistantAvatar() {
  return (
    <Image
      src={APP_ICON}
      alt=""
      width={32}
      height={32}
      className="h-8 w-8 shrink-0 rounded-xl object-contain ring-1 ring-border/40"
    />
  );
}

function MessageBlock({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl bg-[color-mix(in_srgb,var(--brand)_92%,#000)] px-4 py-3 text-white shadow-sm">
          {message.attachments?.length ? (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {message.attachments.map((a) => (
                <span
                  key={a.label}
                  className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium"
                >
                  <Paperclip className="h-3 w-3 opacity-80" />
                  {a.label}
                </span>
              ))}
            </div>
          ) : null}
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <AssistantAvatar />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-xs font-medium text-muted-foreground">Concierge</p>
        <div className="rounded-2xl border border-border/50 bg-[var(--surface)] px-4 py-3 shadow-sm">
          {renderContent(message.content)}
        </div>
        {message.meta ? (
          <p className="text-[10px] text-muted-foreground">{message.meta}</p>
        ) : null}
      </div>
    </div>
  );
}

function QuestionCard({
  question,
  disabled,
  onSelect,
}: {
  question: VaultQuestion;
  disabled: boolean;
  onSelect: () => void;
}) {
  const Icon = question.icon;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className="group flex flex-col gap-3 rounded-2xl border border-border/50 bg-[var(--surface)] p-4 text-left shadow-sm transition-all hover:border-[color-mix(in_srgb,var(--brand)_35%,transparent)] hover:shadow-md disabled:opacity-40"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground transition-colors group-hover:bg-[color-mix(in_srgb,var(--brand)_12%,transparent)] group-hover:text-[var(--brand)]">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-semibold">{question.title}</p>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {question.description}
        </p>
      </div>
    </button>
  );
}

function ChatInputCard({
  input,
  setInput,
  placeholder,
  sending,
  canSend,
  attachmentsUploading,
  onSend,
  textareaRef,
  tipsLoading,
  onTips,
  intent,
  files,
  attachments,
  deviceInputRef,
  onDeviceSelect,
  onVaultAttach,
  onRemoveAttachment,
  onIntentChange,
  selectedModel,
  onModelChange,
  quota,
  quotaLoading,
  compact,
}: {
  input: string;
  setInput: (v: string) => void;
  placeholder: string;
  sending: boolean;
  canSend: boolean;
  attachmentsUploading: boolean;
  onSend: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  tipsLoading: boolean;
  onTips: () => void;
  intent: ChatIntent;
  files: VaultFile[];
  attachments: ReturnType<typeof useChatAttachments>["attachments"];
  deviceInputRef: React.RefObject<HTMLInputElement | null>;
  onDeviceSelect: (files: FileList) => void;
  onVaultAttach: (rootHashes: string[]) => void;
  onRemoveAttachment: (id: string) => void;
  onIntentChange: (intent: ChatIntent) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  quota: ComputeQuota | null;
  quotaLoading: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.75rem] border border-border/60 bg-[var(--surface)] shadow-sm ring-1 ring-border/30 transition-shadow focus-within:ring-[color-mix(in_srgb,var(--brand)_35%,transparent)]",
        compact ? "p-3" : "p-4 sm:p-5"
      )}
    >
      {attachments.length ? (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {attachments.map((a) => (
            <AttachmentChip
              key={a.id}
              attachment={a}
              onRemove={() => onRemoveAttachment(a.id)}
            />
          ))}
        </div>
      ) : null}

      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        rows={compact ? 1 : 2}
        placeholder={placeholder}
        disabled={sending}
        className={cn(
          "w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground",
          compact ? "min-h-[40px] py-1" : "min-h-[72px] py-1"
        )}
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-3">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <IntentToggle
              intent={intent}
              onChange={onIntentChange}
              inline
            />
            {intent === "vault" ? (
              <button
                type="button"
                disabled={tipsLoading || !canSend}
                onClick={onTips}
                title="Personalized questions, once per week"
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors",
                  canSend
                    ? "bg-[color-mix(in_srgb,var(--brand)_12%,transparent)] text-[var(--brand)] hover:bg-[color-mix(in_srgb,var(--brand)_18%,transparent)]"
                    : "bg-muted/50 text-muted-foreground"
                )}
              >
                {tipsLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                Tips
              </button>
            ) : null}
            <ChatAttachmentControls
              files={files}
              attachments={attachments}
              uploading={attachmentsUploading}
              disabled={!canSend || sending}
              deviceInputRef={deviceInputRef}
              onDeviceSelect={onDeviceSelect}
              onVaultAttach={onVaultAttach}
            />
          </div>
          <ChatComputeControls
            selectedModel={selectedModel}
            onModelChange={onModelChange}
            quota={quota}
            quotaLoading={quotaLoading}
          />
        </div>

        <Button
          size="icon"
          className="size-9 rounded-full shadow-sm"
          disabled={
            sending || attachmentsUploading || !input.trim() || !canSend
          }
          onClick={onSend}
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowUp className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
