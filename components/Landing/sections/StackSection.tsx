import Link from "next/link";

const PILLARS = [
  {
    id: "storage",
    layer: "0G Storage",
    use: "Vault",
    punch: "Your files. Your vault.",
    body: "Wallet history, spreadsheets, notes — encrypted on Storage.",
    href: "/dashboard/vault/my-files",
  },
  {
    id: "compute",
    layer: "0G Compute",
    use: "Insights · Talk · Desk",
    punch: "AI you fund yourself.",
    body: "Insights, Talk answers, and trade suggestions — prepaid in OG.",
    href: "/dashboard/vault/insights",
  },
  {
    id: "chain",
    layer: "0G Chain",
    use: "Settlement",
    punch: "Mint, list, rent, transfer.",
    body: "Agentic ID actions settle on Chain with the same wallet.",
    href: "/dashboard/ecosystem",
  },
  {
    id: "agentic",
    layer: "Agentic ID",
    use: "Own the agent",
    punch: "Own the agent.",
    body: "Mint once. Train it. Move it — memory stays with the ID.",
    href: "/dashboard/agent/mint",
  },
];

export function StackSection() {
  return (
    <section id="stack" className="scroll-mt-24 px-6 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
            0G stack
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
            Four layers. One Concierge.
          </h2>
        </div>

        <div className="mt-12 grid gap-3 lg:grid-cols-2">
          {PILLARS.map((p, i) => (
            <Link
              key={p.id}
              href={p.href}
              className="group flex flex-col justify-between rounded-[var(--radius)] bg-[var(--surface)] p-6 transition-colors hover:bg-[color-mix(in_srgb,var(--brand)_7%,var(--surface))] sm:p-8"
            >
              <div>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--brand)]">
                    {p.layer}
                  </span>
                </div>
                <h3 className="mt-8 text-2xl font-semibold tracking-tight group-hover:text-[var(--brand)] sm:text-3xl">
                  {p.punch}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {p.body}
                </p>
              </div>
              <p className="mt-8 text-xs font-medium text-foreground/80">
                In Concierge → {p.use}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
