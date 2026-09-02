import { Suspense } from "react";
import { ChatWorkspace } from "@/components/advisor/ChatWorkspace";
import { ComputeLedgerProvider } from "@/components/vault/ComputeLedgerContext";

export default function AdvisorChatPage() {
  return (
    <ComputeLedgerProvider>
      <Suspense
        fallback={
          <div className="flex min-h-[20rem] items-center justify-center text-sm text-muted-foreground">
            Loading chat…
          </div>
        }
      >
        <ChatWorkspace />
      </Suspense>
    </ComputeLedgerProvider>
  );
}
