"use client"; // needed for hooks like useEffect

import { ReactNode } from "react";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";
import { fontSans } from "@/lib/fonts";
import { WagmiProvider } from "@/components/providers/wagmi-provider";
import { Toaster } from "sonner";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <WagmiProvider>
            {children}
            <Toaster position="bottom-right" />
          </WagmiProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
