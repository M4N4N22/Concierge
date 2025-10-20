"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircleIcon, TriangleAlert } from "lucide-react";

type Model = {
  provider: string;
  model: string;
  verifiability: string;
  minUnits: string;
  tags?: string[];
};

type Ledger = {
  total: bigint;
  locked: bigint;
  available: bigint;
};

export default function ModelDashboard() {
  const [models, setModels] = useState<Model[]>([]);
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [loading, setLoading] = useState(false);
  const [depositAmount, setDepositAmount] = useState(0.1);

  const quickAmounts = [0.1, 0.5, 1];

  async function fetchModels() {
    const res = await fetch("/api/models");
    const data = await res.json();

    // Add custom tags manually for better UX
    const taggedModels: Model[] = (data.models ?? []).map((m: Model) => {
      switch (m.model) {
        case "phala/deepseek-chat-v3-0324":
          return { ...m, tags: ["Cheapest", "Fast Response"] };
        case "phala/gpt-oss-120b":
          return { ...m, tags: ["High Accuracy", "Best for Text"] };
        case "phala/qwen2.5-vl-72b-instruct":
          return { ...m, tags: ["Efficient", "Multimodal"] };
        case "openai/gpt-oss-120b":
          return { ...m, tags: ["Reliable", "Best for Large Files"] };
        default:
          return m;
      }
    });

    setModels(taggedModels);
  }

  async function fetchLedger() {
    const res = await fetch("/api/ledger", {
      method: "POST",
      body: JSON.stringify({ action: "check" }),
    });
    const data = await res.json();
    if (data.exists) {
      const total = BigInt(data.ledger[1] ?? 0);
      const locked = BigInt(data.ledger[2] ?? 0);
      setLedger({ total, locked, available: total - locked });
    } else {
      setLedger(null);
    }
  }

  async function depositLedger() {
    setLoading(true);
    await fetch("/api/ledger", {
      method: "POST",
      body: JSON.stringify({ action: "deposit", amount: depositAmount }),
    });
    await fetchLedger();
    setLoading(false);
  }

  async function createLedger() {
    setLoading(true);
    await fetch("/api/ledger", {
      method: "POST",
      body: JSON.stringify({ action: "create", amount: 0.1 }),
    });
    await fetchLedger();
    setLoading(false);
  }

  async function fundProvider(provider: string, amount: number) {
    setLoading(true);
    await fetch("/api/ledger", {
      method: "POST",
      body: JSON.stringify({ action: "fundSubAccount", subAccount: provider, amount }),
    });
    await fetchLedger();
    setLoading(false);
  }

  useEffect(() => {
    fetchModels();
    fetchLedger();
  }, []);

  const formatOG = (value: number) => {
    if (value >= 0.01) return value.toFixed(4);
    return value.toFixed(8).replace(/\.?0+$/, "");
  };

  const availableOG = ledger ? Number(ledger.available) / 1e18 : 0;
  const availableOGtoFund = ledger ? Number(ledger.locked) / 1e18 : 0;

  const formatAddress = (addr: string) => {
    return addr.slice(0, 6) + "..." + addr.slice(-4);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Available Models</h2>

      {!ledger && (
        <Button onClick={createLedger} className="mb-4">
          Create Ledger (0.1 OG)
        </Button>
      )}

      {ledger && (
        <div className="mb-4 space-y-1">
          <p>Total: {Number(ledger.total) / 1e18} OG</p>
          <p>Locked: {Number(ledger.locked) / 1e18} OG</p>
          <p>Available: {availableOG} OG</p>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="number"
              min={0.1}
              step={0.1}
              value={depositAmount}
              onChange={(e) => setDepositAmount(parseFloat(e.target.value))}
              className="border rounded px-2 py-1 w-24"
            />
            <Button className="secondary" onClick={depositLedger} disabled={loading}>
              Deposit
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
        {models.map((m) => {
          const minOG = Number(m.minUnits) / 1e18;
          const sufficient = availableOG >= minOG;

          return (
            <Card key={`${m.provider}-${m.model}`}>
              <CardHeader>
                <CardTitle className="">
                  {/* Tags */}
                  {m.tags && (
                    <div className="flex flex-wrap gap-2 mb-1">
                      {m.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    {m.model}
                    {sufficient ? (
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    ) : (
                      <TriangleAlert className="w-5 h-5 text-yellow-500" />
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 bg-foreground/5 p-6 rounded-y-3xl">
                <p>
                  Provider:{" "}
                  <span className="font-mono">{formatAddress(m.provider)}</span>
                </p>
                <p>Verifiability: {m.verifiability || "None"}</p>
                <p>Min OG required: {formatOG(minOG)}</p>

                {!sufficient && ledger && (
                  <div className="space-y-2 mt-6">
                    <p className="text-yellow-700 text-sm">
                      You have {formatOG(availableOGtoFund)} OG available. Fund
                      this provider to use it.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {quickAmounts.map((amt) => (
                        <Button
                          key={amt}
                          size="sm"
                          variant="outline"
                          onClick={() => fundProvider(m.provider, amt)}
                          disabled={loading || amt > availableOGtoFund}
                        >
                          Top-up {amt} OG
                        </Button>
                      ))}
                      <input
                        type="number"
                        min={0.01}
                        max={availableOGtoFund}
                        step={0.01}
                        placeholder="Custom"
                        className="border rounded px-2 py-1 w-24"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const val = parseFloat(
                              (e.target as HTMLInputElement).value
                            );
                            if (val > 0 && val <= availableOGtoFund)
                              fundProvider(m.provider, val);
                          }
                        }}
                      />
                      <Button
                      
                        variant="default"
                        className="mt-4"
                        onClick={() => fetchLedger()}
                        disabled={loading}
                      >
                        Refresh
                      </Button>
                    </div>
                  </div>
                )}

                {sufficient && (
                  <p className="text-green-500 mt-6">
                    Sufficient balance to use this model
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
