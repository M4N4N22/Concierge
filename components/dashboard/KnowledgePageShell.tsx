"use client";

import { ComputeLedgerProvider } from "@/components/vault/ComputeLedgerContext";
import { KnowledgeSubnav } from "@/components/knowledge/KnowledgeSubnav";

export function KnowledgePageShell({ children }: { children: React.ReactNode }) {
  return (
    <ComputeLedgerProvider>
      <div className="flex flex-col gap-4 pb-6">
        <KnowledgeSubnav />
        {children}
      </div>
    </ComputeLedgerProvider>
  );
}
