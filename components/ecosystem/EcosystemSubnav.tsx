"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  LayoutGrid,
  KeyRound,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dashboard/ecosystem", label: "Hub", icon: LayoutGrid, exact: true },
  { href: "/dashboard/ecosystem/marketplace", label: "Marketplace", icon: Store },
  { href: "/dashboard/ecosystem/rent", label: "Rent", icon: KeyRound },
  {
    href: "/dashboard/ecosystem/trade",
    label: "Transfer",
    icon: ArrowLeftRight,
  },
] as const;

export function EcosystemSubnav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "flex flex-wrap gap-1.5 rounded-[var(--radius)] bg-muted/40 p-1",
        className
      )}
      aria-label="Ecosystem sections"
    >
      {TABS.map((tab) => {
        const active = tab.exact
          ? pathname === tab.href
          : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
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
