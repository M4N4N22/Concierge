"use client";

import { createContext, useContext } from "react";
import { useComputeLedger } from "@/hooks/useComputeLedger";

type ComputeLedgerContextValue = ReturnType<typeof useComputeLedger>;

const ComputeLedgerContext = createContext<ComputeLedgerContextValue | null>(null);

export function ComputeLedgerProvider({ children }: { children: React.ReactNode }) {
  const value = useComputeLedger();
  return (
    <ComputeLedgerContext.Provider value={value}>{children}</ComputeLedgerContext.Provider>
  );
}

export function useComputeLedgerContext(): ComputeLedgerContextValue {
  const ctx = useContext(ComputeLedgerContext);
  if (!ctx) {
    throw new Error("useComputeLedgerContext must be used within ComputeLedgerProvider");
  }
  return ctx;
}
