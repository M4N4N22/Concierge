import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="px-6 pb-10 pt-6 sm:px-8 sm:pb-14">
      <div className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#12081f] via-[#2a1848] to-[var(--brand)] px-8 py-16 text-center sm:px-14 sm:py-20">
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
              backgroundSize: "160px 160px",
              mixBlendMode: "overlay",
            }}
          />
          <div className="relative mx-auto max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.18em] text-white/70">
              READY
            </p>
            <h2 className="font-display mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Unlock your Concierge on 0G
            </h2>
            <p className="mt-4 text-base leading-relaxed text-white/70">
              Own the vault. Own the identity. Chat with knowledge that stays
              yours — and soon, lend access without sharing private files.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-white px-8 text-[var(--landing-ink)] hover:bg-white/90"
              >
                <Link href="/dashboard">
                  Launch app
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-white/30 bg-transparent px-8 text-white hover:bg-white/10"
              >
                <Link href="/dashboard/agent/mint">Mint Agentic ID</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
