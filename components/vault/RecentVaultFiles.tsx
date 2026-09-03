"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAccount, useChainId } from "wagmi";
import { ArrowUpRight, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserFiles } from "@/hooks/useUserFiles";
import { vaultCategoryLabel } from "@/lib/copy/vaultTerms";
import { truncateHash } from "@/lib/explorer";
import { FileKnowledgeBadge } from "@/components/vault/AutoReadPanel";
import { resolveFileKnowledgeStatus } from "@/lib/vault/autoIndex";
import { useAutoIndex } from "@/components/vault/AutoIndexProvider";

const RECENT_LIMIT = 8;

export function RecentVaultFiles({
  refreshToken = 0,
}: {
  refreshToken?: number;
}) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { files, loading, refetch } = useUserFiles();
  const { jobStates, paused } = useAutoIndex();

  useEffect(() => {
    if (isConnected) void refetch({ silent: true });
  }, [isConnected, chainId, refreshToken, refetch]);

  if (!isConnected) return null;

  const recent = [...files]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, RECENT_LIMIT);

  return (
    <section className="bento scroll-mt-4 p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Recent uploads</h2>
          <p className="text-xs text-muted-foreground">
            Latest files on your vault registry — open All files for search and
            pagination.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link href="/dashboard/vault/my-files">
            All files
            <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {loading && recent.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading registry…
        </div>
      ) : recent.length === 0 ? (
        <div className="rounded-2xl bg-muted/40 px-6 py-10 text-center">
          <FileText className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium">No uploads yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Files appear here after you upload and register on 0G.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">File</th>
                <th className="pb-2 pr-4 font-medium">Category</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 font-medium">Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((file) => {
                const knowledgeStatus = resolveFileKnowledgeStatus(
                  file,
                  jobStates[file.rootHash],
                  paused
                );
                return (
                  <tr
                    key={file.rootHash}
                    className="border-t border-border/50"
                  >
                    <td className="py-2.5 pr-4 font-medium">
                      {truncateHash(file.rootHash, 8, 6)}
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground">
                      {vaultCategoryLabel(file.category)}
                    </td>
                    <td className="py-2.5 pr-4">
                      <FileKnowledgeBadge status={knowledgeStatus} />
                    </td>
                    <td className="py-2.5 text-muted-foreground">
                      {new Date(file.timestamp * 1000).toLocaleDateString(
                        undefined,
                        {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
