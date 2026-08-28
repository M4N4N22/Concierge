"use client";

import { useState, useRef } from "react";
import { useAccount, useChainId } from "wagmi";
import {
  Wallet,
  FileSpreadsheet,
  ClipboardPaste,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useAddToVault } from "@/hooks/useAddToVault";
import { useWalletEvidence } from "@/hooks/useWalletEvidence";
import {
  normalizeBriefingEvidence,
  normalizeCsvEvidence,
  normalizeFromFileContent,
  registerEvidencePack,
  type VaultEvidence,
} from "@/lib/evidence";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = {
  onRegistered?: (result: {
    rootHash: string;
    txHash?: string;
    pack: VaultEvidence;
  }) => void;
  disabled?: boolean;
};

export default function EvidenceIntake({ onRegistered, disabled }: Props) {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { addFile } = useAddToVault();
  const { fetchWalletEvidence, loading: walletLoading } = useWalletEvidence();

  const [busy, setBusy] = useState(false);
  const [briefing, setBriefing] = useState("");
  const [briefingTitle, setBriefingTitle] = useState("");
  const [preview, setPreview] = useState<VaultEvidence | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const locked = disabled || busy || !isConnected;

  const commit = async (pack: VaultEvidence) => {
    setBusy(true);
    setPreview(pack);
    try {
      const result = await registerEvidencePack(pack, addFile, {
        useTestnet: true,
      });
      if (result) onRegistered?.(result);
    } finally {
      setBusy(false);
    }
  };

  const handleWalletSync = async () => {
    if (!isConnected) return;
    setBusy(true);
    try {
      const pack = await fetchWalletEvidence();
      setPreview(pack);
      const result = await registerEvidencePack(pack, addFile, {
        useTestnet: true,
      });
      if (result) onRegistered?.(result);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Wallet sync failed");
    } finally {
      setBusy(false);
    }
  };

  const handleCsvFile = async (file: File) => {
    const text = await file.text();
    const pack = normalizeCsvEvidence(text, {
      fileName: file.name,
      wallet: address,
      chainId,
      source: "csv",
    });
    setPreview(pack);
    await commit(pack);
  };

  const handleBriefing = async () => {
    if (!briefing.trim()) {
      toast.error("Paste a receipt, tx, or decision context first");
      return;
    }
    const pack = normalizeBriefingEvidence(briefing, {
      wallet: address,
      chainId,
      title: briefingTitle || undefined,
    });
    setPreview(pack);
    await commit(pack);
    setBriefing("");
    setBriefingTitle("");
  };

  return (
    <section className="rounded-2xl border bg-card shadow-sm overflow-hidden">
      <div className="border-b px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Clean evidence intake</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Schema-first packs for the AI board — wallet sync, CSV, or paste. Agents
              read structured facts, not messy PDFs.
            </p>
          </div>
        </div>
      </div>

      <div className="p-5">
        {!isConnected && (
          <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-muted-foreground">
            Connect your wallet to sync on-chain evidence and register packs.
          </div>
        )}

        <Tabs defaultValue="wallet" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto p-1">
            <TabsTrigger value="wallet" className="gap-1.5 text-xs sm:text-sm py-2">
              <Wallet className="h-3.5 w-3.5" />
              Wallet
            </TabsTrigger>
            <TabsTrigger value="csv" className="gap-1.5 text-xs sm:text-sm py-2">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              CSV
            </TabsTrigger>
            <TabsTrigger value="paste" className="gap-1.5 text-xs sm:text-sm py-2">
              <ClipboardPaste className="h-3.5 w-3.5" />
              Paste
            </TabsTrigger>
          </TabsList>

          <TabsContent value="wallet" className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Pull native balance and recent token transfers into a{" "}
              <code className="text-xs bg-muted px-1 rounded">evidence:wallet</code> pack.
              Zero file upload — cleanest cold start.
            </p>
            <Button
              type="button"
              onClick={handleWalletSync}
              disabled={locked || walletLoading}
              className="w-full sm:w-auto gap-2"
            >
              {(busy || walletLoading) && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Sync wallet evidence
            </Button>
          </TabsContent>

          <TabsContent value="csv" className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Import a bank / card / subscription CSV. We normalize rows into spend or
              subscription facts before vault registration.
            </p>
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              disabled={locked}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) await handleCsvFile(file);
              }}
            />
            <Button
              type="button"
              variant="outline"
              disabled={locked}
              className="gap-2"
              onClick={() => csvInputRef.current?.click()}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              Choose CSV export
            </Button>
          </TabsContent>

          <TabsContent value="paste" className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Paste a receipt, tx hash context, or decision brief for the board session.
            </p>
            <Input
              placeholder="Optional title (e.g. March dining review)"
              value={briefingTitle}
              onChange={(e) => setBriefingTitle(e.target.value)}
              disabled={locked}
            />
            <Textarea
              placeholder={`Example:\nDining Spent: $200 on 2025-11-03 at Cafe Luna.\nOr paste a transaction / proposal you want the board to review.`}
              value={briefing}
              onChange={(e) => setBriefing(e.target.value)}
              disabled={locked}
              rows={5}
              className="resize-y min-h-[120px]"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={handleBriefing}
                disabled={locked || !briefing.trim()}
                className="gap-2"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Normalize & register
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={locked || !briefing.trim()}
                onClick={() => {
                  const pack = normalizeBriefingEvidence(briefing, {
                    wallet: address,
                    chainId,
                    title: briefingTitle || undefined,
                  });
                  setPreview(pack);
                  toast.message("Preview ready — register when it looks right");
                }}
              >
                Preview only
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {preview && (
          <div
            className={cn(
              "mt-5 rounded-xl border bg-muted/20 p-4 space-y-2",
              busy && "opacity-70"
            )}
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-sm font-medium">{preview.title}</p>
              <span className="text-[11px] font-medium rounded-full bg-primary/10 text-primary px-2 py-0.5">
                evidence:{preview.type} · {Math.round(preview.confidence * 100)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{preview.summary}</p>
            <ul className="grid sm:grid-cols-2 gap-1.5 pt-1">
              {preview.facts.slice(0, 8).map((f) => (
                <li
                  key={`${f.key}-${String(f.value)}`}
                  className="text-xs rounded-md bg-background/80 border px-2.5 py-1.5 truncate"
                >
                  <span className="text-muted-foreground">{f.key}: </span>
                  <span className="font-medium">
                    {String(f.value)}
                    {f.unit ? ` ${f.unit}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

/** Used by file upload path to turn text/csv into evidence before vault write. */
export async function normalizeUploadFile(
  file: File,
  ctx: { wallet?: string; chainId?: number }
): Promise<VaultEvidence | null> {
  const lower = file.name.toLowerCase();
  const readable =
    lower.endsWith(".txt") ||
    lower.endsWith(".csv") ||
    lower.endsWith(".json") ||
    file.type.startsWith("text") ||
    file.type === "application/json";

  if (!readable) return null;

  try {
    const content = await file.text();
    if (!content.trim()) return null;
    return normalizeFromFileContent(file.name, content, {
      wallet: ctx.wallet,
      chainId: ctx.chainId,
      source: "upload",
    });
  } catch {
    return null;
  }
}
