"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { ArrowUpRight, FileStack, Layers, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import FileList from "@/components/vault/FileList";
import { VaultPageShell } from "@/components/dashboard/VaultPageShell";
import { useUserFiles } from "@/hooks/useUserFiles";
import { CollapsibleGuideRail, type GuideItem } from "@/components/dashboard/CollapsibleGuideRail";

const FILES_GUIDE: GuideItem[] = [
  {
    id: "registry",
    icon: FileStack,
    title: "On-chain registry",
    body: "Every upload is recorded on your vault contract — hash, category, and Insights CIDs when available.",
  },
  {
    id: "knowledge",
    icon: Layers,
    title: "Agent knowledge",
    body: "Status badges show whether Chat can use a file — Quick add, Auto-read, or manual Insights.",
  },
  {
    id: "knowledge",
    icon: Sparkles,
    title: "Feed knowledge base",
    body: "Stored-only files need feeding on the Knowledge base before Chat can answer from them.",
  },
];

function VaultFilesBody() {
  const { isConnected, chainId } = useAccount();
  const { refetch } = useUserFiles();

  useEffect(() => {
    if (isConnected) void refetch({ silent: true });
  }, [isConnected, chainId, refetch]);

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18.5rem] xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex flex-col gap-4">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <h1 className="text-2xl font-semibold sm:text-3xl">All files</h1>
            <p className="max-w-xl text-sm text-muted-foreground">
              Search, browse, and inspect everything in your vault registry.
              Expand any row for storage hash, preview, and knowledge status.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/dashboard/vault">Vault overview</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/dashboard/vault/upload">
                Upload more
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </header>

        <section id="registry" className="bento scroll-mt-4 p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold">File registry</h2>
            <p className="text-xs text-muted-foreground">
              Paginated list with search and previews
            </p>
          </div>
          <FileList paginated pageSize={10} view="table" />
        </section>
      </div>

      <CollapsibleGuideRail
        heading="Registry help"
        subheading="Status, search, and Insights."
        items={FILES_GUIDE}
      />
    </div>
  );
}

export function VaultFilesWorkspace() {
  return (
    <VaultPageShell>
      <VaultFilesBody />
    </VaultPageShell>
  );
}
