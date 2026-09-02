import Link from "next/link";

const BEATS = [
  {
    n: "01",
    title: "Save your data in the vault",
    detail: "Storage",
    body: "Sync a wallet, upload a spreadsheet, paste notes. Everything lands on 0G Storage and shows up in your vault.",
    href: "/dashboard/vault/my-files",
  },
  {
    n: "02",
    title: "Run Insights when you’re ready",
    detail: "Compute",
    body: "Fund compute once. Label and summarize your files so Chat and Desk aren’t staring at raw dumps.",
    href: "/dashboard/vault/insights",
  },
  {
    n: "03",
    title: "Chat with your data",
    detail: "Compute + vault",
    body: "Ask about spending and documents. Answers stay grounded in what you uploaded — advisory, not trading theater.",
    href: "/dashboard/advisor/chat",
  },
  {
    n: "04",
    title: "Mint your Agentic ID",
    detail: "Chain + Agentic ID",
    body: "One agent per wallet, linked to your vault. That’s ownership — not a rented login.",
    href: "/dashboard/agent/mint",
  },
  {
    n: "05",
    title: "Trade with agents you control",
    detail: "Desk",
    body: "They suggest Buy / Sell / Hold from balances. You size, quote OG/USDC, and confirm. Nothing sneaks through.",
    href: "/dashboard/trading/desk",
  },
  {
    n: "06",
    title: "List, rent, or transfer",
    detail: "Ecosystem",
    body: "Move the Agentic ID across wallets. The agent’s memory travels with it — marketplace, rent, or send.",
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
            Six beats from empty wallet to owned agent. Each step maps to a 0G
            layer — not a slide in a pitch deck.
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
                <span className="text-[11px] font-semibold    text-[var(--brand)] sm:text-right">
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
