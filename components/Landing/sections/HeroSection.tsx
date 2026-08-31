import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

const STACK_PROOF = ["Storage", "Compute", "Chain", "Agentic ID"] as const;

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-6 pb-0 pt-36 sm:px-8 sm:pt-44">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div
          className="absolute inset-x-0 bottom-0 h-[42%]"
          style={{
            background:
              "linear-gradient(to top, var(--surface) 0%, color-mix(in srgb, var(--surface) 70%, transparent) 45%, transparent 100%)",
          }}
        />
      </div>

      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start lg:gap-12">
          <div>
            <div
              className="landing-fade inline-flex items-center rounded-full bg-[var(--surface)] px-3.5 py-1.5 text-xs text-muted-foreground ring-1 ring-border/70"
              style={{ animationDelay: "0ms" }}
            >
              Built on 0G
            </div>

            <h1
              className="landing-fade mt-5 text-7xl font-semibold leading-[1.08] tracking-tight sm:text-7xl lg:text-[4.4rem]"
              style={{ animationDelay: "80ms" }}
            >
              Your wallet-owned{" "}
              <span className="text-[var(--brand)]">AI stack</span> for every
              decision
            </h1>
          </div>

          <div className="lg:pt-2">
            <p
              className="landing-fade text-base leading-relaxed text-muted-foreground sm:text-[1.05rem]"
              style={{ animationDelay: "100ms" }}
            >
              Vault your data. Run 0G Compute. Mint an Agentic ID. Talk and
              trade with an agent you own.
            </p>

            <div
              className="landing-fade mt-7 flex flex-wrap items-center gap-3"
              style={{ animationDelay: "180ms" }}
            >
              <Button asChild size="lg" className="rounded-full px-6">
                <Link href="/dashboard">
                  Launch app
                  <span className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="rounded-full px-4 text-foreground"
              >
                <a href="#stack" className="gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full ring-1 ring-border">
                    <Play className="h-3.5 w-3.5 fill-current" />
                  </span>
                  How we use 0G
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Laptop stage */}
        <div
          className="landing-fade relative mx-auto mt-24 max-w-4xl pb-10 sm:mt-24 sm:pb-14"
          style={{ animationDelay: "220ms" }}
        >
          <div className="absolute -left-1 top-8 z-20 hidden w-[12rem] rounded-2xl bg-[var(--surface)] p-3.5 shadow-xl  md:block lg:-left-4 lg:top-12">
        
            <p className="mt-1.5 text-sm font-semibold tracking-tight">
              12 files saved
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Wallet · spreadsheet · notes
            </p>
          </div>

          <div className="absolute -right-1 top-16 z-20 hidden w-[12rem] rounded-2xl bg-[var(--surface)] p-3.5 shadow-xl  md:block lg:-right-4">
         
            <p className="mt-1.5 text-sm font-semibold tracking-tight">
              Insights ready
            </p>
            <p className="mt-0.5 text-[11px] text-[var(--success)]">
              AI funded and online
            </p>
          </div>

          <div className="absolute bottom-16 left-4 z-20 hidden w-[12.5rem] rounded-2xl bg-[var(--surface)] p-3.5 shadow-xl  md:block lg:left-8">
        
            <p className="mt-1.5 text-sm font-semibold tracking-tight">
              Agent #7 minted
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Linked to your vault
            </p>
          </div>

          {/* Laptop */}
          <div className="relative mx-auto w-full max-w-3xl">
            {/* Lid / screen bezel */}
            <div className="overflow-hidden rounded-t-xl bg-[var(--ink)] p-2.5 pb-0 shadow-[0_40px_80px_-28px_rgba(0,0,0,0.5)] ring-1 ring-black/15 dark:ring-white/10 sm:rounded-t-2xl sm:p-3 sm:pb-0">
              <div className="overflow-hidden rounded-t-md bg-[var(--surface)] sm:rounded-t-md">
                {/* Title bar */}
                <div className="flex items-center gap-2 border-b border-border/60 bg-muted/40 px-3 py-2.5">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                  </div>
                  <div className="mx-auto max-w-xs flex-1 truncate rounded-md bg-[var(--surface)] px-3 py-1 text-center font-mono text-[10px] text-muted-foreground ring-1 ring-border/50">
                    concierge.app / talk
                  </div>
                  <span className="hidden w-10 sm:block" />
                </div>

                <div className="grid min-h-[18rem] sm:min-h-[22rem] sm:grid-cols-[11rem_minmax(0,1fr)]">
                  {/* Side rail */}
                  <aside className="hidden border-r border-border/60 bg-muted/25 p-3 sm:block">
                    <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Concierge
                    </p>
                    <ul className="mt-3 space-y-1 text-xs">
                      {[
                        ["Vault", true],
                        ["Insights", false],
                        ["Talk", true],
                        ["Agentic ID", false],
                        ["Desk", false],
                      ].map(([label, active]) => (
                        <li
                          key={label as string}
                          className={
                            active
                              ? "rounded-lg bg-[color-mix(in_srgb,var(--brand)_12%,transparent)] px-2.5 py-1.5 font-medium text-[var(--brand)]"
                              : "rounded-lg px-2.5 py-1.5 text-muted-foreground"
                          }
                        >
                          {label}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-6 rounded-xl bg-[var(--surface)] p-2.5 ring-1 ring-border/50">
                      <p className="text-[10px] text-muted-foreground">
                        Your files
                      </p>
                      <p className="mt-1 text-lg font-semibold tabular-nums">
                        12
                      </p>
                    </div>
                  </aside>

                  {/* Main talk pane */}
                  <div className="flex flex-col p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">
                          Talk
                        </p>
                        <p className="text-sm font-semibold tracking-tight">
                          Ask about your vault
                        </p>
                      </div>
                      <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
                        Agent #7
                      </span>
                    </div>

                    <div className="mt-5 flex flex-1 flex-col gap-3">
                      <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-[var(--brand)] px-3.5 py-2.5 text-[13px] leading-snug text-white">
                        Where did I overspend last month?
                      </div>
                      <div className="max-w-[88%] rounded-2xl rounded-bl-md bg-muted/70 px-3.5 py-2.5 text-[13px] leading-snug">
                        <p className="font-medium">From your files</p>
                        <p className="mt-1 text-muted-foreground">
                          Subscriptions hit hardest — three renewals the same
                          week. I can draft a cut list before you open Desk.
                        </p>
                      </div>
                      <div className="mt-auto rounded-xl bg-muted/45 px-3 py-2.5">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          Using
                        </p>
                        <p className="mt-1 text-[12px] text-foreground/85">
                          spending spreadsheet · wallet history · notes
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Base / keyboard deck */}
            <div className="relative mx-auto h-3 w-[102%] -translate-x-[1%] rounded-b-xl bg-[var(--ink)] sm:h-3.5 sm:rounded-b-2xl">
              <div className="absolute left-1/2 top-0 h-1 w-24 -translate-x-1/2 rounded-b-md bg-white/10 sm:w-28" />
            </div>
            <div className="mx-auto h-2 w-[108%] -translate-x-[3.5%] rounded-b-2xl bg-[color-mix(in_srgb,var(--ink)_88%,#000)] shadow-[0_24px_40px_-20px_rgba(0,0,0,0.55)]" />

            <div
              className="pointer-events-none absolute inset-x-[-10%] bottom-[-12%] -z-10 h-28 blur-2xl"
              style={{
                background:
                  "radial-gradient(ellipse at center, var(--surface) 0%, transparent 70%)",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
