"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrainCircuit, Cpu, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  {
    href: "/dashboard/knowledge",
    label: "Overview",
    icon: LayoutGrid,
    exact: true,
  },
  {
    href: "/dashboard/knowledge/feed",
    label: "Feed files",
    icon: BrainCircuit,
    exact: false,
  },
  {
    href: "/dashboard/knowledge/compute",
    label: "Compute",
    icon: Cpu,
    exact: false,
  },
] as const;

function isTabActive(pathname: string, href: string, exact: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function KnowledgeSubnav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "flex flex-wrap gap-1.5 rounded-[var(--radius)] bg-muted/40 p-1",
        className
      )}
      aria-label="Knowledge base sections"
    >
      {TABS.map((tab) => {
        const active = isTabActive(pathname, tab.href, tab.exact);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
              active
                ? "bg-[var(--surface)] text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-[var(--surface)]/60 hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
