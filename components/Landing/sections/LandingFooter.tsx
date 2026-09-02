import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="border-t border-border/60 px-6 py-10 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-lg font-semibold  ">Concierge</p>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
            Storage · Compute · Chain · Agentic ID — composed into a personal
            desk on 0G.
          </p>
        </div>
        <div className="flex flex-wrap gap-5 text-xs text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground">
            App
          </Link>
          <a
            href="https://0g.ai"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            0G
          </a>
          <a
            href="https://docs.0g.ai/concepts/agentic-id"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            Agentic ID
          </a>
          <a
            href="https://docs.0g.ai"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            Docs
          </a>
        </div>
      </div>
    </footer>
  );
}
