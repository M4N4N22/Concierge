import Link from "next/link";

const SURFACES = [
  {
    title: "Chat",
    line: "Ask the vault. Skip the generic lecture.",
    body: "Spend patterns, documents, wallet activity — grounded in your files. Trading lives next door.",
    href: "/dashboard/advisor/chat",
    tone: "surface" as const,
  },
  {
    title: "Desk",
    line: "Agents suggest. You confirm.",
    body: "Buy / Sell / Hold from balances, then quote OG/USDC. Strategies sit one click away.",
    href: "/dashboard/trading/desk",
    tone: "brand" as const,
  },
  {
    title: "Agentic ID",
    line: "Mint once. Carry the intelligence.",
    body: "Vault-bound identity on 0G Chain. Learn domains, then list, rent, or transfer.",
    href: "/dashboard/agent/mint",
    tone: "ink" as const,
  },
  {
    title: "Ecosystem",
    line: "Move agents like assets.",
    body: "Marketplace sales, timed rentals, P2P transfer — ownership and metadata travel together.",
    href: "/dashboard/ecosystem",
    tone: "surface" as const,
  },
];

export function ProductSection() {
  return (
    <section id="product" className="scroll-mt-24 px-6 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold    text-[var(--brand)]">
            Desk
          </p>
          <h2 className="mt-3 text-3xl font-semibold   sm:text-5xl">
            Where the stack shows up
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
                      : "text-[var(--brand)]"
                  }`}
                >
                  {item.title}
                </p>
                <div className="relative mt-10">
                  <h3
                    className={`text-2xl font-semibold   sm:text-3xl ${title}`}
                  >
                    {item.line}
                  </h3>
                  <p className={`mt-3 text-sm leading-relaxed ${muted}`}>
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
