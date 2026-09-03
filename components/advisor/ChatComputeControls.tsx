"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cpu, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useComputeLedgerContext } from "@/components/vault/ComputeLedgerContext";
import type { ComputeQuota } from "@/hooks/useComputeQuota";
import { cachedJson } from "@/lib/cachedJson";
import { COMPUTE_CACHE_TTL, computeCatalogCacheKey } from "@/lib/computeCacheKeys";
import { AUTO_MODEL_ID, type ComputeModelOption } from "@/lib/computeModels";
import { cn } from "@/lib/utils";

type EIP1193Provider = {
  request: (args: {
    method: string;
    params?: unknown[];
  }) => Promise<unknown>;
};

type ChatComputeControlsProps = {
  selectedModel: string;
  onModelChange: (model: string) => void;
  quota: ComputeQuota | null;
  quotaLoading: boolean;
  className?: string;
};

export function ChatComputeControls({
  selectedModel,
  onModelChange,
  quota,
  quotaLoading,
  className,
}: ChatComputeControlsProps) {
  const { readiness, operator } = useComputeLedgerContext();
  const [models, setModels] = useState<ComputeModelOption[]>([]);
  const [defaultModel, setDefaultModel] = useState<string | null>(null);
  const [PayWidget, setPayWidget] = useState<
    React.ComponentType<{ provider: EIP1193Provider }> | null
  >(null);

  useEffect(() => {
    cachedJson<{ models?: ComputeModelOption[]; defaultModel?: string }>(
      computeCatalogCacheKey(),
      "/api/compute/models",
      { ttlMs: COMPUTE_CACHE_TTL.modelsCatalog }
    )
      .then((data) => {
        setModels(data.models ?? []);
        setDefaultModel(data.defaultModel ?? null);
      })
      .catch(() => setModels([]));
  }, []);

  useEffect(() => {
    if (!defaultModel || !models.length) return;
    const ids = new Set(models.map((m) => m.id));
    if (selectedModel === AUTO_MODEL_ID || !ids.has(selectedModel)) {
      onModelChange(defaultModel);
    }
  }, [defaultModel, models, onModelChange, selectedModel]);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ENABLE_OG_PAY !== "true") return;
    import("@0gfoundation/0g-pay-sdk")
      .then((mod) =>
        setPayWidget(() => mod.OGPay as React.ComponentType<{ provider: EIP1193Provider }>)
      )
      .catch(() => setPayWidget(null));
  }, []);

  const showQuota = readiness.operatorSubsidized;
  const pctRemaining =
    quota && quota.limit > 0 ? quota.remaining / quota.limit : null;
  const isLow =
    pctRemaining != null && pctRemaining > 0 && pctRemaining <= 0.15;
  const isExhausted = quota != null && quota.remaining <= 0;
  const pcUrl = operator?.privateComputerUrl ?? "https://pc.0g.ai";

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={
            models.some((m) => m.id === selectedModel)
              ? selectedModel
              : undefined
          }
          onValueChange={onModelChange}
        >
          <SelectTrigger
            size="sm"
            className="h-8 rounded-full border-border/60 bg-muted/30 px-3 text-[11px] font-medium"
          >
            <SelectValue placeholder="Model" />
          </SelectTrigger>
          <SelectContent align="start" className="max-h-72">
            {models.map((m) => (
              <SelectItem key={m.id} value={m.id} className="text-xs">
                <span className="font-medium">{m.label}</span>
                {m.description ? (
                  <span className="ml-1 text-muted-foreground">
                    · {m.description}
                  </span>
                ) : null}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {showQuota ? (
          <div className="inline-flex min-w-0 items-center gap-2 rounded-full bg-muted/40 px-3 py-1.5">
            <Cpu className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            {quotaLoading ? (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            ) : quota ? (
              <>
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      isExhausted
                        ? "bg-destructive"
                        : isLow
                          ? "bg-amber-500"
                          : "bg-[var(--brand)]"
                    )}
                    style={{
                      width: `${Math.max(0, Math.min(100, (pctRemaining ?? 0) * 100))}%`,
                    }}
                  />
                </div>
                <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
                  {quota.remaining}/{quota.limit} chat left this week
                </span>
              </>
            ) : (
              <span className="text-[10px] text-muted-foreground">
                Compute quota
              </span>
            )}
          </div>
        ) : null}
      </div>

      {showQuota && (isLow || isExhausted) ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2">
          <p className="text-[11px] leading-snug text-muted-foreground">
            {isExhausted
              ? "Weekly free chat limit used up — top up to keep chatting."
              : "Running low on free chat quota — top up before you hit the limit."}
          </p>
          <div className="flex flex-wrap gap-2">
            {PayWidget && typeof window !== "undefined" && window.ethereum ? (
              <PayWidget provider={window.ethereum} />
            ) : (
              <Button asChild size="sm" variant="outline" className="h-7 rounded-full text-[11px]">
                <Link href={pcUrl} target="_blank" rel="noopener noreferrer">
                  Top up
                  <ExternalLink className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
