"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import UploadArea from "@/components/vault/UploadArea";
import { AutoReadPanel } from "@/components/vault/AutoReadPanel";
import { RecentVaultFiles } from "@/components/vault/RecentVaultFiles";
import { CollapsibleGuideRail, type GuideItem } from "@/components/dashboard/CollapsibleGuideRail";
import { VaultPageShell } from "@/components/dashboard/VaultPageShell";
import { useUserFiles } from "@/hooks/useUserFiles";
import { AUTO_READ_FAQ } from "@/lib/vault/autoIndex";
import { Cpu, FileStack, Layers, MessageSquare, Sparkles, Wallet } from "lucide-react";

const UPLOAD_GUIDE: GuideItem[] = [
  {
    id: "upload",
    icon: FileStack,
    title: "Store on 0G",
    body: "Upload anything — files land on 0G Storage and your on-chain vault registry.",
  },
  {
    id: "auto-read",
    icon: Sparkles,
    title: AUTO_READ_FAQ[0].title,
    body: AUTO_READ_FAQ[0].body,
  },
  {
    id: "quick-add",
    icon: Layers,
    title: AUTO_READ_FAQ[3].title,
    body: AUTO_READ_FAQ[3].body,
  },
  {
    id: "cost",
    icon: Cpu,
    title: AUTO_READ_FAQ[1].title,
    body: AUTO_READ_FAQ[1].body,
  },
  {
    id: "pause",
    icon: Wallet,
    title: AUTO_READ_FAQ[2].title,
    body: AUTO_READ_FAQ[2].body,
  },
  {
    id: "next",
    icon: MessageSquare,
    title: "After upload",
    body: "Browse all files on the registry page, run Insights, then ask Chat.",
  },
];

function VaultUploadBody() {
  const { isConnected, chainId } = useAccount();
  const { refetch } = useUserFiles();
  const [vaultRefresh, setVaultRefresh] = useState(0);

  useEffect(() => {
    if (isConnected) void refetch({ silent: true });
  }, [isConnected, chainId, refetch, vaultRefresh]);

  const onVaultUpdate = useCallback(() => {
    setVaultRefresh((n) => n + 1);
  }, []);

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18.5rem] xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex flex-col gap-4">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <h1 className="text-2xl font-semibold sm:text-3xl">Upload</h1>
            <p className="max-w-xl text-sm text-muted-foreground">
              Store files on 0G Storage and register them to your vault. Quick
              add packs are ready for Chat immediately; other uploads can use
              Auto-read.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/dashboard/vault">Vault overview</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/dashboard/vault/my-files">
              Browse all files
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </header>

        <AutoReadPanel />

        <section id="intake" className="scroll-mt-4">
          <UploadArea onVaultUpdate={onVaultUpdate} />
        </section>

        <RecentVaultFiles refreshToken={vaultRefresh} />
      </div>

      <CollapsibleGuideRail
        heading="Upload help"
        subheading="Storage, Auto-read, and next steps."
        items={UPLOAD_GUIDE}
      />
    </div>
  );
}

export function VaultUploadWorkspace() {
  return (
    <VaultPageShell>
      <VaultUploadBody />
    </VaultPageShell>
  );
}
