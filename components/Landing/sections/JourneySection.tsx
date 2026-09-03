import Link from "next/link";

const BEATS = [
  {
    n: "01",
    title: "Save files in your vault",
    body: "Upload notes, spreadsheets, wallet history. Everything lands on 0G Storage.",
    href: "/dashboard/vault",
  },
  {
    n: "02",
    title: "Turn files into knowledge",
    body: "Feed uploads through Compute so Concierge can summarize and categorize.",
    href: "/dashboard/knowledge/feed",
  },
  {
    n: "03",
    title: "Chat with your Concierge",
    body: "Ask about your data. Answers stay grounded in what your vault already knows.",
    href: "/dashboard/advisor/chat",
  },
  {
    n: "04",
    title: "Mint one Agentic ID",
    body: "Own a portable Concierge identity bound to your vault — one per wallet.",
    href: "/dashboard/agent/mint",
  },
  {
    n: "05",
    title: "List, rent, or lend access",
    body: "Circulate on the marketplace. Soon: lend use without sharing private files.",
    href: "/dashboard/ecosystem",
  },
] as const;

export function JourneySection() {
  return (
    <section id="journey" className="scroll-mt-24 px-6 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="landing-card overflow-hidden p-2 sm:p-3">
          <div className="rounded-[1.4rem] bg-gradient-to-br from-[#12081f] via-[#1a1030] to-[#3a2458] px-6 py-10 text-white sm:px-10 sm:py-14">
            <p className="text-xs font-semibold text-white/60">Flow</p>
            <h2 className="font-display mt-3 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
              The path you actually walk
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/65">
              Vault → knowledge → chat → own your ID → circulate it.
            </p>

            <ol className="mt-10 space-y-0 divide-y divide-white/10">
              {BEATS.map((beat) => (
                <li key={beat.n}>
                  <Link
                    href={beat.href}
                    className="group grid gap-2 py-5 transition-colors sm:grid-cols-[3.5rem_minmax(0,1fr)] sm:items-baseline sm:gap-6"
                  >
                    <span className="font-mono text-sm text-white/45">
                      {beat.n}
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold group-hover:text-[color-mix(in_srgb,var(--brand)_80%,white)] sm:text-xl">
                        {beat.title}
                      </h3>
                      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/60">
                        {beat.body}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
