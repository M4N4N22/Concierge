"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Clock,
  History,
  Lock,
  Share2,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_SHARE_SLICES,
  listShareableSlices,
} from "@/lib/lendAccess";

const COMING = [
  {
    icon: Share2,
    title: "Choose what they can ask about",
    body: "Pick a slice of your knowledge — writing voice, work notes — not your whole vault.",
  },
  {
    icon: Clock,
    title: "Give timed access",
    body: "Someone else can use your Concierge for a set number of days. You keep ownership.",
  },
  {
    icon: Lock,
    title: "Keep private files private",
    body: "Guests get answers from the slice you allowed. They never browse your uploads.",
  },
  {
    icon: History,
    title: "Build real history",
    body: "Uses leave a trail on your Concierge so it grows more trustworthy over time.",
  },
] as const;

export function LendAccessFoundation() {
  const shareable = listShareableSlices();
  const privateSlices = DEFAULT_SHARE_SLICES.filter((s) => s.ownerOnly);

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-16">
      <div className="dashboard-hero relative overflow-hidden rounded-[var(--radius)] p-5 sm:p-6">
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-30 blur-2xl"
          style={{
            background:
              "radial-gradient(circle, rgba(255,255,255,0.9) 0%, transparent 70%)",
          }}
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <p className="text-[11px] font-medium text-white/75">Coming later</p>
            <h1 className="text-xl font-semibold text-white sm:text-2xl">
              Lend access
            </h1>
            <p className="max-w-xl text-sm text-white/80">
              Let someone use your Concierge for a while — without handing over
              your private files. Foundation only for now; full flow ships in a
              later wave.
            </p>
          </div>
          <Button
            asChild
            size="sm"
            className="rounded-full bg-white px-5 text-black shadow-md hover:bg-white/95"
          >
            <Link href="/dashboard/ecosystem/rent">
              Today&apos;s rentals
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {COMING.map((item) => (
          <div
            key={item.title}
            className="rounded-[var(--radius)] bg-[var(--surface)] p-5 ring-1 ring-border/50"
          >
            <item.icon className="h-5 w-5 text-[var(--brand)]" />
            <h2 className="mt-3 text-base font-semibold">{item.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {item.body}
            </p>
          </div>
        ))}
      </div>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-[var(--brand)]" />
          <h2 className="text-sm font-semibold">Starter slices (preview)</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          These labels will drive what a guest can ask. Nothing is live yet.
        </p>
        <ul className="divide-y divide-border/60 overflow-hidden rounded-[var(--radius)] bg-[var(--surface)] ring-1 ring-border/50">
          {shareable.map((slice) => (
            <li key={slice.id} className="px-5 py-4">
              <p className="text-sm font-semibold">{slice.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {slice.description}
              </p>
              <p className="mt-2 text-[11px] font-medium text-[var(--success)]">
                OK to lend
              </p>
            </li>
          ))}
          {privateSlices.map((slice) => (
            <li key={slice.id} className="px-5 py-4 opacity-80">
              <p className="text-sm font-semibold">{slice.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {slice.description}
              </p>
              <p className="mt-2 text-[11px] font-medium text-muted-foreground">
                Owner only
              </p>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-center text-xs text-muted-foreground">
        Need to sell or rent the ID itself today? Use{" "}
        <Link
          href="/dashboard/ecosystem"
          className="font-medium text-foreground underline-offset-2 hover:underline"
        >
          Ecosystem
        </Link>
        .
      </p>
    </div>
  );
}
