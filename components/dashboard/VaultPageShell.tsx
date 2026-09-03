"use client";

import { ComputeLedgerProvider } from "@/components/vault/ComputeLedgerContext";
import { AutoIndexProvider } from "@/components/vault/AutoIndexProvider";
import { VaultSubnav } from "@/components/vault/VaultSubnav";
import { useUserFiles } from "@/hooks/useUserFiles";

function VaultProviders({ children }: { children: React.ReactNode }) {
  const { refetch } = useUserFiles();
  return (
    <AutoIndexProvider onIndexed={() => void refetch({ silent: true })}>
      {children}
    </AutoIndexProvider>
  );
}

export function VaultPageShell({ children }: { children: React.ReactNode }) {
  return (
    <ComputeLedgerProvider>
      <VaultProviders>
        <div className="flex flex-col gap-4 pb-6">
          <VaultSubnav />
          {children}
        </div>
      </VaultProviders>
    </ComputeLedgerProvider>
  );
}
