"use client";

import { useState } from "react";
import Link from "next/link";
import { JourneyStepHeader } from "@/components/dashboard/JourneyStepHeader";
import UploadArea from "@/components/vault/UploadArea";
import FileList from "@/components/vault/FileList";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { ArrowRight } from "lucide-react";

export default function MyFilesPage() {
  const [vaultRefresh, setVaultRefresh] = useState(0);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <JourneyStepHeader
        step={1}
        journeyId="upload"
        title="Evidence"
        tagline="Vault"
        description="Add clean evidence packs from wallet, CSV, or paste. Text uploads normalize to VaultEvidence before 0G Storage."
      />

      <UploadArea onVaultUpdate={() => setVaultRefresh((n) => n + 1)} />

      <Panel>
        <PanelHeader
          title="Vault registry"
          hint="On-chain file hashes. Expand a row to preview from 0G Storage."
          action={
            <Button asChild size="sm" variant="ghost">
              <Link href="/dashboard/vault/chat">
                War Room
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          }
        />
        <FileList refreshToken={vaultRefresh} />
      </Panel>
    </div>
  );
}
