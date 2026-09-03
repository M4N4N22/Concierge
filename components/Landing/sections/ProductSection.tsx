import Link from "next/link";

const SURFACES = [
  {
    title: "Vault & Knowledge",
    line: "Store first. Make it useful.",
    body: "Uploads on Storage. Feed them through Compute so Concierge answers from summaries — not filenames alone.",
    href: "/dashboard/vault",
    wide: false,
  },
  {
    title: "Chat",
    line: "Ask your Concierge.",
    body: "Questions grounded in your vault. Fund compute, build knowledge, then talk to an assistant that knows your files.",
    href: "/dashboard/advisor/chat",
    wide: false,
  },
  {
    title: "Agentic ID",
    line: "Mint once. Own it.",
    body: "One Concierge per wallet, tied to your vault. Keep it, sell it, rent it — the identity travels with you.",
    href: "/dashboard/agent/mint",
    wide: true,
  },
  {
    title: "Ecosystem & lend access",
    line: "Circulate — without a file dump.",
    body: "List or transfer today. Lend access is next: let someone use your Concierge without seeing private uploads.",
    href: "/dashboard/ecosystem",
    wide: true,
  },
] as const;

export function ProductSection() {
  return (
    <section id="product" className="scroll-mt-24 px-6 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="landing-pill mx-auto">Our product</p>
          <h2 className="font-display mt-5 text-3xl font-semibold tracking-tight sm:text-5xl">
            Built for people who want to own their intelligence
          </h2>
          <p className="mt-4 text-[var(--landing-muted)] leading-relaxed">
            Concierge streamlines vault → knowledge → chat → identity, so your
            personal AI is an asset — not a rented chat box.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2">
          {SURFACES.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className={`landing-card group flex min-h-[15rem] flex-col justify-between p-6 transition-transform duration-300 hover:-translate-y-0.5 sm:p-8 ${
                item.wide ? "sm:col-span-1" : ""
              }`}
            >
              <p className="text-[11px] font-semibold text-[var(--brand)]">
                {item.title}
              </p>
              <div className="pt-10">
                <h3 className="font-display text-2xl font-semibold tracking-tight group-hover:text-[var(--brand)]">
                  {item.line}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--landing-muted)]">
                  {item.body}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
