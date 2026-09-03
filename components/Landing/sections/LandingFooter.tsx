import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="border-t border-[var(--landing-line)] px-6 py-10 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-lg font-semibold">Concierge</p>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-[var(--landing-muted)]">
            Personal AI on 0G — a vault you control, a Concierge you own, and
            access you can lend without giving away your files.
          </p>
        </div>
        <div className="flex flex-wrap gap-5 text-xs text-[var(--landing-muted)]">
          <Link href="/dashboard" className="hover:text-[var(--landing-ink)]">
            App
          </Link>
          <a
            href="https://0g.ai"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[var(--landing-ink)]"
          >
            0G
          </a>
          <a
            href="https://docs.0g.ai/concepts/agentic-id"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[var(--landing-ink)]"
          >
            Agentic ID
          </a>
          <a
            href="https://docs.0g.ai"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[var(--landing-ink)]"
          >
            Docs
          </a>
        </div>
      </div>
    </footer>
  );
}
