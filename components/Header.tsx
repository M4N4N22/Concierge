"use client";

import dynamic from "next/dynamic";
//const WalletButton = dynamic(() => import("./WalletButton"), { ssr: false });

import Link from "next/link";
import { ModeToggle } from "./ThemeToggle";



export const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/10 backdrop-blur-md px-40 shadow-lg">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-start">
          {/* Left: Logo + NavigationMenu (stacked vertically) */}
          <div className="flex flex-col items-start gap-2">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">
                    C
                  </span>
                </div>
                <span className="text-xl font-semibold">Concierge</span>
              </div>
            </Link>

            {/* NavigationMenu */}
          
          </div>

          {/* Right: Theme toggle & WalletButton */}
          <div className="flex items-center gap-4">
            <ModeToggle />
            {/* <WalletButton /> */}
          </div>
        </div>
      </div>
    </header>
  );
};
