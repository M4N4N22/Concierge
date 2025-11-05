// components/DashboardHeader.tsx
"use client";

import { Bell, Search } from "lucide-react";
import { ModeToggle } from "./ThemeToggle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ChainSwitcher } from "./ChainSwitcher";

export function DashboardHeader() {
  return (
    <header className="flex items-center justify-between border-b px-6 py-3">
      {/* Left side: Could show section or app name */}
      <div className="text-lg font-semibold"></div>

      {/* Middle: Global search (optional) */}
      <div className="flex-1 px-6 max-w-xl">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search files, agents, insights..."
            className="pl-8"
          />
        </div>
      </div>

      {/* Right side: Notifications + User */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        <ModeToggle />
        <ChainSwitcher />
        {/* Wallet connect button */}
        <ConnectButton />
      </div>
    </header>
  );
}
