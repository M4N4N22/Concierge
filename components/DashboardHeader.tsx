"use client";

import { usePathname } from "next/navigation";
import { ModeToggle } from "./ThemeToggle";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { getStepByPath } from "@/lib/journey";
import Link from "next/link";

export function DashboardHeader() {
  const pathname = usePathname();
  const step = getStepByPath(pathname);
  const isHome = pathname === "/dashboard";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between bg-background px-5 md:px-6">
      <div className="min-w-0 text-xs text-muted-foreground">
        {isHome ? (
          <span className="font-medium text-foreground">Home</span>
        ) : step ? (
          <span className="truncate">
            <Link href="/dashboard" className="hover:text-foreground">
              Home
            </Link>
            <span className="mx-1.5 opacity-40">/</span>
            <span className="font-medium text-foreground">{step.shortTitle}</span>
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
