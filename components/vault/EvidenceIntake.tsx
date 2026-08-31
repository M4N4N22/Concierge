"use client";

import { useState, useRef } from "react";
import { useAccount, useChainId } from "wagmi";
import { Wallet, FileSpreadsheet, ClipboardPaste, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FieldLabel } from "@/components/ui/hint";
import { Panel, PanelHeader } from "@/components/ui/panel";
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

  return (
    <Panel>
      <PanelHeader
        title="Evidence intake"
        hint="Wallet sync, CSV, or paste — normalized to VaultEvidence before Storage."
      />

      {!isConnected && (
        <p className="mb-3 text-xs text-muted-foreground">Connect wallet to register packs.</p>
      )}

      <Tabs defaultValue="wallet">
        <TabsList className="h-8 w-full grid grid-cols-3 rounded-md bg-muted p-0.5">
          <TabsTrigger value="wallet" className="text-xs gap-1.5 rounded-sm">
            <Wallet className="h-3 w-3" />
            Wallet
          </TabsTrigger>
          <TabsTrigger value="csv" className="text-xs gap-1.5 rounded-sm">
            <FileSpreadsheet className="h-3 w-3" />
            CSV
          </TabsTrigger>
          <TabsTrigger value="paste" className="text-xs gap-1.5 rounded-sm">
            <ClipboardPaste className="h-3 w-3" />
            Paste
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wallet" className="mt-3">
          <Button
            size="sm"
            onClick={async () => {
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
                toast.error(err instanceof Error ? err.message : "Sync failed");
              } finally {
                setBusy(false);
              }
            }}
            disabled={locked || walletLoading}
          >
            {(busy || walletLoading) && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Sync wallet
          </Button>
        </TabsContent>

        <TabsContent value="csv" className="mt-3">
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            disabled={locked}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              const pack = normalizeCsvEvidence(await file.text(), {
                fileName: file.name,
                wallet: address,
                chainId,
                source: "csv",
              });
              await commit(pack);
            }}
          />
          <Button
            size="sm"
            variant="outline"
            disabled={locked}
            onClick={() => csvInputRef.current?.click()}
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Choose CSV
          </Button>
        </TabsContent>

        <TabsContent value="paste" className="mt-3 space-y-2">
          <div>
            <FieldLabel>Title</FieldLabel>
            <Input
              value={briefingTitle}
              onChange={(e) => setBriefingTitle(e.target.value)}
              disabled={locked}
              placeholder="Optional"
            />
          </div>
          <div>
            <FieldLabel hint="Receipt, tx context, or decision brief for the board.">
              Briefing
            </FieldLabel>
            <Textarea
              value={briefing}
              onChange={(e) => setBriefing(e.target.value)}
              disabled={locked}
              rows={4}
            />
          </div>
          <Button
            size="sm"
            disabled={locked || !briefing.trim()}
            onClick={async () => {
              const pack = normalizeBriefingEvidence(briefing, {
                wallet: address,
                chainId,
                title: briefingTitle || undefined,
              });
              await commit(pack);
              setBriefing("");
              setBriefingTitle("");
            }}
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Register
          </Button>
        </TabsContent>
      </Tabs>

      {preview && (
        <div className="mt-4 rounded-md bg-muted/60 px-3 py-2.5 space-y-1">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-medium truncate">{preview.title}</span>
            <span className="text-muted-foreground shrink-0">
              {preview.type} · {Math.round(preview.confidence * 100)}%
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground truncate">{preview.summary}</p>
        </div>
      )}
    </Panel>
  );
}

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
