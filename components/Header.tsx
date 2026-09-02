"use client";

import Link from "next/link";
import { ModeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "#stack", label: "0G stack" },
  { href: "#journey", label: "Flow" },
  { href: "#product", label: "Desk" },
  { href: "#faq", label: "FAQ" },
] as const;

export function Header() {
  return (
    <header className="fixed inset-x-0 top-4 z-50 px-4 sm:px-6">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 rounded-full bg-[var(--ink)] p-5 text-white shadow-[0_12px_40px_-18px_rgba(0,0,0,0.55)] sm:px-4 dark:bg-[#0a0a0a] dark:ring-1 dark:ring-white/10">
        <Link
          href="/"
          className="shrink-0 px-2 text-lg font-semibold   sm:text-xl"
        >
          Concierge
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-1.5 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ModeToggle className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white" />
          <Button
            asChild
            size="sm"
            className="rounded-full bg-[var(--brand)] px-4 text-white hover:bg-[var(--brand)]/90"
          >
            <Link href="/dashboard">Launch app</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
