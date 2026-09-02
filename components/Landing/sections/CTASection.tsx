import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="px-6 pb-20 pt-4 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="bento-ink relative overflow-hidden px-8 py-16 sm:px-14 sm:py-20">
          <div
            className="pointer-events-none absolute -left-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full blur-[90px]"
            style={{
              background:
                "color-mix(in srgb, var(--brand) 55%, transparent)",
            }}
          />
          <div className="relative max-w-2xl">
            <p className="text-[11px] font-semibold   tracking-[0.2em] text-[var(--brand)]">
              Go
            </p>
            <h2 className="mt-4 text-3xl font-semibold   text-white sm:text-5xl">
              Wire your wallet to the 0G stack.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-white/65">
              Vault on Storage. Insights on Compute. Agentic ID on Chain. Then
              Chat and Trade like you own the agent — because you do.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-[var(--brand)] px-7 text-white hover:bg-[var(--brand)]/90"
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
                className="rounded-full border-white/25 bg-transparent px-7 text-white hover:bg-white/10"
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
