import Link from "next/link";

const SURFACES = [
  {
    title: "Vault & Insights",
    line: "Store first. Make it knowledge.",
    body: "Uploads on 0G Storage. Insights (or Quick add) turn them into agent knowledge Concierge can use.",
    href: "/dashboard/vault",
    tone: "surface" as const,
  },
  {
    title: "Chat",
    line: "Ask your Concierge.",
    body: "Grounded in agent knowledge — not raw dumps. Needs funded compute plus vault files Concierge can read.",
    href: "/dashboard/advisor/chat",
    tone: "brand" as const,
  },
  {
    title: "Agentic ID",
    line: "Mint once. Own the identity.",
    body: "One Concierge per wallet, vault-bound. chat casually or ask your data — focus chips are query modes, not separate agents.",
    href: "/dashboard/agent/mint",
    tone: "ink" as const,
  },
  {
    title: "Ecosystem",
    line: "List, rent, or transfer.",
    body: "Marketplace, Concierge rentals, P2P send — ownership and vault binding travel with the ID.",
    href: "/dashboard/ecosystem",
    tone: "surface" as const,
  },
];

export function ProductSection() {
  return (
    <section id="product" className="scroll-mt-24 px-6 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold   text-[var(--brand)]">
            Product
          </p>
          <h2 className="mt-3 text-3xl font-semibold   sm:text-5xl">
            Where Concierge shows up
          </h2>
        </div>

        <div className="mt-12 grid gap-3 sm:grid-cols-2">
          {SURFACES.map((item) => {
            const shell =
              item.tone === "brand"
                ? "bento-brand"
                : item.tone === "ink"
                  ? "bento-ink relative overflow-hidden"
                  : "bento";
            const title =
              item.tone === "surface" ? "text-foreground" : "text-white";
            const muted =
              item.tone === "surface"
                ? "text-muted-foreground"
                : item.tone === "brand"
                  ? "text-white/75"
                  : "text-white/65";

            return (
              <Link
                key={item.title}
                href={item.href}
                className={`group flex min-h-[14rem] flex-col justify-between p-6 transition-transform duration-300 hover:-translate-y-0.5 sm:p-8 ${shell}`}
              >
                {item.tone === "ink" ? (
                  <div
                    className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-3xl"
                    style={{
                      background:
                        "radial-gradient(circle, var(--brand), transparent 70%)",
                    }}
                  />
                ) : null}
                <p
                  className={`relative text-[11px] font-semibold     ${
                    item.tone === "surface"
                      ? "text-[var(--brand)]"
                      : "text-white/80"
                  }`}
                >
                  {item.title}
                </p>
                <div className="relative mt-auto pt-8">
                  <h3 className={`text-xl font-semibold sm:text-2xl ${title}`}>
                    {item.line}
                  </h3>
                  <p className={`mt-2 text-sm leading-relaxed ${muted}`}>
                    {item.body}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
