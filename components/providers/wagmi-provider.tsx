"use client";

import { ReactNode, useMemo } from "react";
import { useTheme } from "next-themes";
import { WagmiProvider as BaseWagmiProvider } from "wagmi";
import {
  RainbowKitProvider,
  darkTheme,
  lightTheme,
} from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config, zeroGTestnet } from "@/lib/wagmi/config";

const queryClient = new QueryClient();

const BRAND = "#B75FFF";

const sharedTheme = {
  accentColor: BRAND,
  accentColorForeground: "white",
  borderRadius: "large" as const,
  overlayBlur: "small" as const,
};

function RainbowKitThemed({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();

  const theme = useMemo(() => {
    if (resolvedTheme === "dark") {
      return darkTheme({
        ...sharedTheme,
        accentColor: BRAND,
      });
    }
    return lightTheme({
      ...sharedTheme,
      accentColor: BRAND,
    });
  }, [resolvedTheme]);

  return (
    <RainbowKitProvider
      theme={theme}
      initialChain={zeroGTestnet}
      appInfo={{
        appName: "Concierge",
        learnMoreUrl: "https://0g.ai",
      }}
      modalSize="compact"
    >
      {children}
    </RainbowKitProvider>
  );
}

export function WagmiProvider({ children }: { children: React.ReactNode }) {
  return (
    <BaseWagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitThemed>{children}</RainbowKitThemed>
      </QueryClientProvider>
    </BaseWagmiProvider>
  );
}
