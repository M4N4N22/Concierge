import Link from "next/link";

const BEATS = [
  {
    n: "01",
    title: "Save files in your vault",
    detail: "Storage",
    body: "Sync a wallet, upload a spreadsheet, paste notes. Everything lands on 0G Storage and shows up in your Vault registry.",
    href: "/dashboard/vault",
  },
  {
    n: "02",
    title: "Turn storage into agent knowledge",
    detail: "Compute",
    body: "Fund compute once. Run Insights to categorize and summarize — Concierge can’t use raw uploads until they’re knowledge.",
    href: "/dashboard/knowledge/feed",
  },
  {
    n: "03",
    title: "Chat with your Concierge",
    detail: "Compute + vault",
    body: "Ask about spending and documents. Answers stay grounded in agent knowledge — not filenames alone.",
    href: "/dashboard/advisor/chat",
  },
  {
    n: "04",
    title: "Mint one Agentic ID",
    detail: "Chain",
    body: "One Concierge identity per wallet — your portable personality. Chat casually or ask vault questions in chat; finance, travel, and subscriptions are focus chips there — not separate agents.",
    href: "/dashboard/agent/mint",
  },
  {
    n: "05",
    title: "List, rent, or transfer",
    detail: "Ecosystem",
    body: "Sell on the marketplace, rent timed Concierge access while you keep ownership (not a private file dump), or send P2P. The vault binding travels with the ID.",
    href: "/dashboard/ecosystem",
  },
];

export function JourneySection() {
  return (
    <section id="journey" className="scroll-mt-24 px-6 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold    text-[var(--brand)]">
            Flow
          </p>
          <h2 className="mt-3 text-3xl font-semibold   sm:text-5xl">
            The path you actually walk
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Vault → knowledge → chat → ownable Agentic ID → ecosystem. Trading
            desk is optional — same Concierge, secondary mode.
          </p>
        </div>

        <ol className="mt-12 divide-y divide-border/70 border-y border-border/70">
          {BEATS.map((beat) => (
            <li key={beat.n}>
              <Link
                href={beat.href}
                className="group grid gap-3 py-7 transition-colors hover:bg-[color-mix(in_srgb,var(--brand)_5%,transparent)] sm:grid-cols-[4rem_minmax(0,1fr)_8rem] sm:items-baseline sm:gap-6 sm:px-2"
              >
                <span className="font-mono text-sm tabular-nums text-muted-foreground">
                  {beat.n}
                </span>
                <div>
                  <h3 className="text-xl font-semibold   group-hover:text-[var(--brand)] sm:text-2xl">
                    {beat.title}
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {beat.body}
                  </p>
                </div>
                <span className="text-xs font-medium text-muted-foreground sm:text-right">
                  {beat.detail}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
