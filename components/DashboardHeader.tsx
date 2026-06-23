"use client";

import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { ModeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { getStepByPath } from "@/lib/journey";
import Link from "next/link";

export function DashboardHeader() {
  const pathname = usePathname();
  const step = getStepByPath(pathname);

  return (
    <header className="flex items-center justify-between border-b border-border/60 px-6 py-3 bg-background/80 backdrop-blur-sm">
      <div className="min-w-0">
        {pathname === "/dashboard" ? (
          <p className="text-sm font-medium text-muted-foreground">
            Journey overview
          </p>
        ) : step ? (
          <p className="text-sm text-muted-foreground truncate">
            <Link href="/dashboard" className="hover:text-primary">
              Journey
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-foreground font-medium">{step.shortTitle}</span>
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Button variant="ghost" size="icon" className="hidden sm:flex">
          <Bell className="h-5 w-5" />
        </Button>
        <ModeToggle />
        <ConnectButton />
      </div>
    </header>
  );
}
