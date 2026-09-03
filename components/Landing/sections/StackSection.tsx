import Link from "next/link";

const PILLARS = [
  {
    title: "Vault on Storage",
    body: "Bills, notes, writing samples, wallet history — held privately and registered on-chain.",
    href: "/dashboard/vault",
    visual: "storage",
  },
  {
    title: "Knowledge via Compute",
    body: "Turn uploads into knowledge Concierge can use, then chat with answers grounded in your files.",
    href: "/dashboard/knowledge",
    visual: "compute",
  },
  {
    title: "One Agentic ID",
    body: "Mint once per wallet. Own a Concierge bound to your vault.",
    href: "/dashboard/agent/mint",
    visual: "id",
  },
  {
    title: "Earn from your Concierge",
    body: "Sell or rent it on the marketplace. Soon: lend access without sharing private files.",
    href: "/dashboard/ecosystem",
    visual: "Ecosystem",
  },
] as const;

export function StackSection() {
  return (
    <section id="stack" className="scroll-mt-24 px-6 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="landing-pill mx-auto">0G stack</p>
          <h2 className="font-display mt-5 text-3xl font-semibold tracking-tight sm:text-5xl">
            Next-gen personal AI on 0G
          </h2>
          <p className="mt-4 text-[var(--landing-muted)] leading-relaxed">
            Built to give you a Concierge that knows your vault — and an
            identity you actually own.
          </p>
        </div>

        <div className="mt-14 grid gap-4 lg:grid-cols-2">
          {PILLARS.map((p, i) => (
            <Link
              key={p.title}
              href={p.href}
              className="landing-card group grid gap-6 p-6 transition-transform duration-300 hover:-translate-y-0.5 sm:grid-cols-[1fr_8.5rem] sm:p-8"
            >
              <div>
                <p className="font-mono text-xs text-[var(--landing-muted)]">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="font-display mt-4 text-2xl font-semibold tracking-tight group-hover:text-[var(--brand)]">
                  {p.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--landing-muted)]">
                  {p.body}
                </p>
              </div>
              <div className="relative flex min-h-[7rem] items-center justify-center overflow-hidden ">
                <StackVisual kind={p.visual} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function StackVisual({ kind }: { kind: (typeof PILLARS)[number]["visual"] }) {
  if (kind === "storage") {
    return (
      <div className="flex -space-x-3">
        {[0, 1, 2].map((n) => (
          <span
            key={n}
            className="h-12 w-12 rounded-full bg-[var(--landing-ink)] ring-4 ring-white"
            style={{ opacity: 1 - n * 0.25 }}
          />
        ))}
      </div>
    );
  }
  if (kind === "compute") {
    return (
      <div className="flex -space-x-3">
        <span className="h-10 w-10 rounded-xl bg-[var(--brand)] ring-4 ring-white opacity-70" />
        <span className="h-10 w-10 rounded-xl bg-[var(--landing-ink)] ring-4 ring-white opacity-70" />
        <span className="h-10 w-10 rounded-xl bg-[#6b3fa0] ring-4 ring-white opacity-70" />
      </div>
    );
  }
  if (kind === "id") {
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--landing-ink)] text-xs font-semibold text-white">
        ID
      </div>
    );
  }
  return (
    <div className="flex h-12 w-24 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-[var(--landing-line)] text-[11px] font-semibold text-[var(--landing-ink)]">
      Lend
    </div>
  );
}
