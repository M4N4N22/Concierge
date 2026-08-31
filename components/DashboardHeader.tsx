"use client";

import { usePathname } from "next/navigation";
import { ModeToggle } from "./ThemeToggle";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { getStepByPath } from "@/lib/journey";
import Link from "next/link";

export function DashboardHeader() {
  const pathname = usePathname();
  const step = getStepByPath(pathname);

  return (
    <header className="flex h-12 items-center justify-between bg-background px-6 hairline border-b">
      <div className="min-w-0 text-xs text-muted-foreground">
        {pathname === "/dashboard" ? (
          <span>Overview</span>
        ) : step ? (
          <span className="truncate">
            <Link href="/dashboard" className="hover:text-foreground">
              Journey
            </Link>
            <span className="mx-1.5 opacity-40">/</span>
            <span className="text-foreground">{step.shortTitle}</span>
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <ModeToggle />
        <ConnectButton
          accountStatus="address"
          chainStatus="icon"
          showBalance={false}
        />
      </div>
    </header>
  );
}
