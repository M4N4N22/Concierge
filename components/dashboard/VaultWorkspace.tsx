"use client";



import { useCallback, useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { useAccount } from "wagmi";

import {

  ArrowUpRight,

  Cable,

  Cpu,

  FileStack,

  Layers,

  LineChart,

  MessageSquare,

  Sparkles,

  Wallet,

} from "lucide-react";

import { Button } from "@/components/ui/button";

import UploadArea from "@/components/vault/UploadArea";

import FileList from "@/components/vault/FileList";

import { CollapsibleGuideRail, type GuideItem } from "@/components/dashboard/CollapsibleGuideRail";

import { ComputeLedgerProvider } from "@/components/vault/ComputeLedgerContext";

import { AutoIndexProvider } from "@/components/vault/AutoIndexProvider";

import { AutoReadPanel } from "@/components/vault/AutoReadPanel";

import { useUserFiles } from "@/hooks/useUserFiles";

import { isAgentKnowledge } from "@/lib/copy/vaultTerms";

import { VAULT_TERMS } from "@/lib/copy/vaultTerms";

import { AUTO_READ_FAQ } from "@/lib/vault/autoIndex";



const GUIDE: GuideItem[] = [

  {

    id: "vault",

    icon: FileStack,

    title: "What is the vault?",

    body: "Your private filing cabinet on 0G — upload anything like Drive. Concierge can only answer questions about files it has read (agent knowledge).",

  },

  {

    id: "auto-read",

    icon: Sparkles,

    title: AUTO_READ_FAQ[0].title,

    body: AUTO_READ_FAQ[0].body,

  },

  {

    id: "cost",

    icon: Cpu,

    title: AUTO_READ_FAQ[1].title,

    body: AUTO_READ_FAQ[1].body,

  },

  {

    id: "uploads-pause",

    icon: Wallet,

    title: AUTO_READ_FAQ[2].title,

    body: AUTO_READ_FAQ[2].body,

  },

  {

    id: "quick-add",

    icon: Layers,

    title: AUTO_READ_FAQ[3].title,

    body: AUTO_READ_FAQ[3].body,

  },

  {

    id: "manual",

    icon: MessageSquare,

    title: AUTO_READ_FAQ[4].title,

    body: AUTO_READ_FAQ[4].body,

  },

  {

    id: "chat",

    icon: MessageSquare,

    title: "Chat with your data",

    body: "Ask questions once files are Ready to ask — structured Quick add files work immediately; others after Auto-read or manual Insights.",

  },

  {

    id: "trade",

    icon: LineChart,

    title: "Trading desk",

    body: "Agents suggest Buy, Sell, or Hold from wallet balances. Separate from vault uploads but saves trade records back here.",

  },

  {

    id: "connectors",

    icon: Cable,

    title: "Connectors",

    body: "Soon: link banks, exchanges, and cloud drives so files ingest automatically.",

    badge: "Soon",

    accent: true,

  },

];



function VaultBody() {

  const { isConnected, chainId } = useAccount();

  const { files, loading, refetch } = useUserFiles();

  const [vaultRefresh, setVaultRefresh] = useState(0);



  useEffect(() => {

    if (isConnected) void refetch({ silent: true });

  }, [isConnected, chainId, refetch, vaultRefresh]);



  const onVaultUpdate = useCallback(() => {

    setVaultRefresh((n) => n + 1);

  }, []);



  const stats = useMemo(() => {

    const knowledge = files.filter(isAgentKnowledge);

    const boards = files.filter((f) => f.category === "evidence:board");

    const storedOnly = files.filter((f) => !isAgentKnowledge(f));

    return {

      total: files.length,

      knowledge: knowledge.length,

      boards: boards.length,

      storedOnly: storedOnly.length,

    };

  }, [files]);



  const primaryCta =

    stats.knowledge > 0

      ? {

          href: "/dashboard/advisor/chat",

          label: "Continue to chat",

        }

      : null;



  return (

    <div className="flex flex-col gap-4 pb-6">

      <header className="flex flex-wrap items-end justify-between gap-4">

        <div className="min-w-0 space-y-1">


          <h1 className="text-2xl font-semibold   sm:text-3xl">

            Your vault

          </h1>

          <p className="max-w-xl text-sm text-muted-foreground">

            Upload anything to 0G Storage. Turn on Auto-read so Concierge can

            learn from new files — or use Quick add for instant structure.

          </p>

        </div>

        {primaryCta ? (

          <Button asChild className="rounded-full px-5">

            <Link href={primaryCta.href}>

              {primaryCta.label}

              <ArrowUpRight className="h-4 w-4" />

            </Link>

          </Button>

        ) : null}

      </header>



      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18.5rem] xl:grid-cols-[minmax(0,1fr)_20rem]">

        <div className="flex flex-col gap-4">

          <div className="grid gap-3 sm:grid-cols-3">

            <div className="bento p-5">

              <div className="flex items-center justify-between">

                <span className="text-xs font-medium text-muted-foreground">

                  {VAULT_TERMS.stored}

                </span>

                <FileStack className="h-4 w-4 text-muted-foreground" />

              </div>

              <p className="mt-5 text-3xl font-semibold tabular-nums">

                {isConnected ? stats.total : "—"}

              </p>

              <p className="mt-1 text-[11px] text-muted-foreground">

                {VAULT_TERMS.storedDetail}

              </p>

            </div>



            <div className="bento-brand p-5">

              <div className="flex items-center justify-between">

                <span className="text-xs font-medium text-white/80">

                  {VAULT_TERMS.knowledge}

                </span>

                <Layers className="h-4 w-4 text-white/80" />

              </div>

              <p className="mt-5 text-3xl font-semibold tabular-nums text-white">

                {isConnected ? stats.knowledge : "—"}

              </p>

              <p className="mt-1 text-[11px] text-white/75">

                Ready to ask in Chat

              </p>

            </div>



            <div className="bento-ink relative overflow-hidden p-5">

              <div

                className="pointer-events-none absolute -right-6 -top-6 h-12 w-12 rounded-full opacity-100 blur-xl"

                style={{

                  background:

                    "radial-gradient(circle, var(--brand) 100%, transparent 100%)",

                }}

              />

              <div className="relative flex items-center justify-between">

                <span className="text-xs font-medium text-white/70">

                  Stored only

                </span>

                <Sparkles className="h-4 w-4 text-white/70" />

              </div>

              <p className="relative mt-5 text-3xl font-semibold tabular-nums text-white">

                {isConnected ? stats.storedOnly : "—"}

              </p>

              <p className="relative mt-1 text-[11px] text-white/65">

                {stats.storedOnly > 0

                  ? "Turn on Auto-read or run Insights"

                  : "All files ready or none yet"}

              </p>

            </div>

          </div>



          <AutoReadPanel />



          <section id="intake" className="scroll-mt-4">

            <UploadArea onVaultUpdate={onVaultUpdate} />

          </section>



          <section id="registry" className="bento scroll-mt-4 p-5">

            <div className="mb-4">

              <h2 className="text-sm font-semibold  ">

                Your uploaded files

              </h2>

              <p className="text-xs text-muted-foreground">

                Status shows whether Chat can use each file

                {loading ? " · refreshing…" : ""}.

              </p>

            </div>

            <FileList refreshToken={vaultRefresh} compact />

          </section>

        </div>



        <CollapsibleGuideRail

          heading="Vault FAQ"

          subheading="Storage, Auto-read, and Chat."

          items={GUIDE}

        />

      </div>

    </div>

  );

}

function VaultShell() {
  const { refetch } = useUserFiles();
  return (
    <AutoIndexProvider onIndexed={() => void refetch({ silent: true })}>
      <VaultBody />
    </AutoIndexProvider>
  );
}

export function VaultWorkspace() {
  return (
    <ComputeLedgerProvider>
      <VaultShell />
    </ComputeLedgerProvider>
  );
}
