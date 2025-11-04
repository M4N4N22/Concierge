"use client";

import dynamic from "next/dynamic";
//const WalletButton = dynamic(() => import("./WalletButton"), { ssr: false });

import Link from "next/link";
import { ModeToggle } from "./ThemeToggle";



export const Header = () => {
  return (
    <header className="fixed top-4 left-12 right-12 z-50 backdrop-blur-md  rounded-xl bg-background/30 text-foreground p-2">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-start">
          {/* Left: Logo + NavigationMenu (stacked vertically) */}
          <div className="flex flex-col items-start gap-2">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center">
           
                <span className="text-3xl tracking-tight">Concierge</span>
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
