"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Check, ChevronDown, Globe, Loader2, Wallet } from "lucide-react";
import { formatEther } from "viem";
import { useBalance, useSwitchChain } from "wagmi";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  networkShortLabel,
  zeroGMainnet,
  zeroGTestnet,
} from "@/lib/wagmi/config";
import { cn } from "@/lib/utils";

const NETWORK_OPTIONS = [
  {
    chainId: zeroGTestnet.id,
    label: "Galileo Testnet",
    hint: "Testnet",
  },
  {
    chainId: zeroGMainnet.id,
    label: "0G Mainnet",
    hint: "Mainnet",
  },
] as const;

function formatAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function formatOgBalance(value: bigint | undefined): string {
  if (value == null) return "—";
  const n = Number(formatEther(value));
  if (!Number.isFinite(n)) return "—";
  if (n === 0) return "0";
  if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
  if (n >= 1) return n.toLocaleString(undefined, { maximumFractionDigits: 3 });
  if (n >= 0.001) return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function OgBalancePill({
  address,
  chainId,
}: {
  address: `0x${string}`;
  chainId: number;
}) {
  const { data, isLoading } = useBalance({
    address,
    chainId,
    query: {
      refetchInterval: 30_000,
    },
  });

  const title =
    data != null
      ? `${formatEther(data.value)} OG on ${networkShortLabel(chainId)}`
      : "Native OG balance";

  return (
    <div
      className="hidden h-9 items-center gap-1 rounded-full border border-border/60 bg-muted/30 px-3 text-xs font-medium tabular-nums sm:inline-flex"
      title={title}
    >
      {isLoading ? (
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
      ) : (
        <>
          <span className="text-foreground">{formatOgBalance(data?.value)}</span>
          <span className="text-muted-foreground">OG</span>
        </>
      )}
    </div>
  );
}

function NetworkSwitcher({
  chainId,
  unsupported,
  onFixNetwork,
}: {
  chainId: number;
  unsupported?: boolean;
  onFixNetwork: () => void;
}) {
  const { switchChain, isPending } = useSwitchChain();

  if (unsupported) {
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-9 rounded-full border-amber-500/40 bg-amber-500/10 px-3 text-xs font-medium text-amber-700 dark:text-amber-300"
        onClick={onFixNetwork}
      >
        Switch network
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 rounded-full border-border/60 bg-muted/30 px-3 text-xs font-medium"
          disabled={isPending}
        >
          <Globe className="h-3.5 w-3.5 shrink-0 text-[var(--brand)]" />
          <span className="max-w-[5.5rem] truncate sm:max-w-none">
            {isPending ? "Switching…" : networkShortLabel(chainId)}
          </span>
          {isPending ? (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[11rem]">
        {NETWORK_OPTIONS.map((option) => {
          const active = chainId === option.chainId;
          return (
            <DropdownMenuItem
              key={option.chainId}
              className="flex items-center justify-between gap-3"
              onClick={() => {
                if (!active) switchChain({ chainId: option.chainId });
              }}
            >
              <span>
                <span className="block text-sm font-medium">{option.label}</span>
                <span className="text-[10px] text-muted-foreground">
                  {option.hint}
                </span>
              </span>
              {active ? (
                <Check className="h-4 w-4 shrink-0 text-[var(--brand)]" />
              ) : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function WalletControls({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          mounted,
        }) => {
          if (!mounted) {
            return (
              <div className="flex gap-1.5">
                <div className="h-9 w-[5.5rem] animate-pulse rounded-full bg-muted/50" />
                <div className="hidden h-9 w-[4.5rem] animate-pulse rounded-full bg-muted/50 sm:block" />
                <div className="h-9 w-[6.5rem] animate-pulse rounded-full bg-muted/50" />
              </div>
            );
          }

          if (!account || !chain) {
            return (
              <Button
                type="button"
                size="sm"
                className="h-9 gap-1.5 rounded-full bg-[var(--brand)] px-4 text-white hover:bg-[var(--brand)]/90"
                onClick={openConnectModal}
              >
                <Wallet className="h-3.5 w-3.5" />
                Connect wallet
              </Button>
            );
          }

          const display =
            account.displayName &&
              !account.displayName.startsWith("0x") &&
              account.displayName.length <= 20
              ? account.displayName
              : formatAddress(account.address);

          return (
            <>
              {!chain.unsupported ? (
                <OgBalancePill
                  address={account.address as `0x${string}`}
                  chainId={chain.id}
                />
              ) : null}
              <NetworkSwitcher
                chainId={chain.id}
                unsupported={chain.unsupported}
                onFixNetwork={openChainModal}
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 max-w-[9rem] gap-1.5 truncate rounded-full border-border/60 bg-muted/30 px-3 font-mono text-xs tabular-nums sm:max-w-[10rem]"
                onClick={openAccountModal}
                title={account.address}
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--success)]" />
                {display}
              </Button>
            </>
          );
        }}
      </ConnectButton.Custom>
    </div>
  );
}
