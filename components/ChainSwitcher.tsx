"use client";

import { useChainId, useSwitchChain } from "wagmi";
import { zeroGMainnet,zeroGTestnet } from "@/lib/wagmi/config"; 
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

const CHAINS = [
  { id: zeroGMainnet.id, label: "Aristotle (Mainnet)" },
  { id: zeroGTestnet.id, label: "Gaileelio (Testnet)" },
];

export function ChainSwitcher() {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  return (
    <Select
      defaultValue={String(chainId)}
      onValueChange={(value) => switchChain({ chainId: Number(value) })}
    >
      <SelectTrigger className="w-[160px]">
        <SelectValue placeholder="Select Network" />
      </SelectTrigger>
      <SelectContent>
        {CHAINS.map((c) => (
          <SelectItem key={c.id} value={String(c.id)}>
            {c.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
