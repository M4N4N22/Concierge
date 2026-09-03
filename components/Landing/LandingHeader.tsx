import Link from "next/link";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "#stack", label: "Stack" },
  { href: "#journey", label: "Flow" },
  { href: "#product", label: "Product" },
  { href: "#faq", label: "FAQ" },
] as const;

export function LandingHeader() {
  return (
    <header className="fixed inset-x-0 top-4 z-50 right-0 left-0 px-5 py-4  sm:px-8">
      <div className="">
      <div className="mx-auto flex max-w-6xl items-center justify-between  p-6 rounded-full bg-black">
        <Link
          href="/"
          className="font-display text-xl font-semibold tracking-tight text-white"
        >
          Concierge
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-1.5 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <Button
          asChild
      
          className="rounded-full bg-white px-5 py-4 text-[var(--landing-ink)] hover:bg-white/90"
        >
          <Link href="/dashboard">Launch app</Link>
        </Button>
      </div>
      </div>
    </header>
  );
}
