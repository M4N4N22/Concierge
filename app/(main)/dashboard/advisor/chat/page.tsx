import { ChatWorkspace } from "@/components/advisor/ChatWorkspace";
import { ComputeLedgerProvider } from "@/components/vault/ComputeLedgerContext";

export default function AdvisorChatPage() {
  return (
    <ComputeLedgerProvider>
      <ChatWorkspace />
    </ComputeLedgerProvider>
  );
}
