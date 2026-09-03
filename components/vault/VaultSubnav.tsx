"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileStack, LayoutGrid, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  {
    href: "/dashboard/vault",
    label: "Overview",
    icon: LayoutGrid,
    exact: true,
  },
  {
    href: "/dashboard/vault/upload",
    label: "Upload",
    icon: Upload,
    exact: false,
  },
  {
    href: "/dashboard/vault/my-files",
    label: "All files",
    icon: FileStack,
    exact: false,
  },
] as const;

function isTabActive(
  pathname: string,
  href: string,
  exact: boolean
): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function VaultSubnav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "flex flex-wrap gap-1.5 rounded-[var(--radius)] bg-muted/40 p-1",
        className
      )}
      aria-label="Vault sections"
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
