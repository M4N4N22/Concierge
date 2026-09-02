"use client";

import { useState } from "react";
import Link from "next/link";
import { useChainId } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useINFTAgent } from "@/hooks/useINFTAgent";
import { useAgenticId } from "@/hooks/useAgenticId";
import { VAULT_ADDRESSES } from "@/lib/addresses";
import { zeroGTestnet } from "@/lib/wagmi/config";

export default function INFTAgentUI() {
  const {
    mintAgent,
    getAgentProfile,
    getEncryptedMetadata,
    updateMetadata,
    updateProfile,
  } = useINFTAgent();
  const { agent, hasAgent, loading: agentLoading, refetch } = useAgenticId();
  const chainId = useChainId();

  const defaultVault =
    (VAULT_ADDRESSES[chainId] || VAULT_ADDRESSES[zeroGTestnet.id]) ?? "";

  const [vault, setVault] = useState(defaultVault);
  const [encryptedHash, setEncryptedHash] = useState("0x" + "11".repeat(32));
  const [domain, setDomain] = useState("concierge.board");
  const [embeddingURI, setEmbeddingURI] = useState("0g://board/pending");
  const [aiSignature, setAiSignature] = useState("chair_v1");

  const [agentId, setAgentId] = useState("");
  const [newEncryptedHash, setNewEncryptedHash] = useState("");
  const [newEmbeddingURI, setNewEmbeddingURI] = useState("");
  const [newAiSignature, setNewAiSignature] = useState("");
  const [agentData, setAgentData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  const handleMint = async () => {
    setLoading(true);
    try {
      const tx = await mintAgent({
        vault: vault as `0x${string}`,
        encryptedHash: encryptedHash as `0x${string}`,
        domain,
        embeddingURI,
        aiSignature,
      });
      await refetch();
      alert(
        `Board Chair minted!\nTx: ${tx}\nOpen Chat to bind sessions.`
      );
    } catch (err) {
      console.error(err);
      alert("Mint failed — check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const resolveId = () =>
    agentId || (agent ? agent.tokenId.toString() : "");

  const handleRead = async () => {
    setLoading(true);
    try {
      const id = resolveId();
      if (!id) throw new Error("Enter token id");
      const profile = await getAgentProfile(BigInt(id));
      const metadata = await getEncryptedMetadata(BigInt(id));
      setAgentData({ profile, metadata });
    } catch (err) {
      console.error(err);
      alert("Failed to fetch agent details");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMetadata = async () => {
    setLoading(true);
    try {
      const id = resolveId();
      const tx = await updateMetadata(
        BigInt(id),
        newEncryptedHash as `0x${string}`
      );
      alert(`Metadata updated successfully!\nTx: ${tx}`);
    } catch (err) {
      console.error(err);
      alert("Update failed");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const id = resolveId();
      const tx = await updateProfile(BigInt(id), newEmbeddingURI, newAiSignature);
      await refetch();
      alert(`Profile updated successfully!\nTx: ${tx}`);
    } catch (err) {
      console.error(err);
      alert("Profile update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto">
      {agentLoading ? (
        <div className="rounded-xl border px-4 py-3 text-sm text-muted-foreground">
          Checking Agentic ID…
        </div>
      ) : hasAgent && agent ? (
        <div className="rounded-xl border border-primary/25 bg-primary/[0.03] px-4 py-4 space-y-2">
          <p className="text-sm font-semibold">
            Board Chair active · Token #{agent.tokenId.toString()}
          </p>
          <p className="text-xs text-muted-foreground break-all">
            Domain: {agent.domain || "—"} · Profile:{" "}
            {agent.embeddingURI || "not bound yet"}
          </p>
          <Button asChild size="sm" variant="outline">
            <Link href="/dashboard/advisor/chat">Open Chat</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
          Mint once per wallet. This token chairs board sessions and stores the
          latest firewall seal.
        </div>
      )}

      <div className="space-y-2 border p-4 rounded-xl">
        <h3 className="font-semibold">Mint Agentic ID (Board Chair)</h3>
        <Input
          placeholder="Vault Address"
          value={vault}
          onChange={(e) => setVault(e.target.value)}
          disabled={hasAgent}
        />
        <Input
          placeholder="Encrypted Hash (0x...)"
          value={encryptedHash}
          onChange={(e) => setEncryptedHash(e.target.value)}
          disabled={hasAgent}
        />
        <Input
          placeholder="Domain"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          disabled={hasAgent}
        />
        <Input
          placeholder="Embedding URI"
          value={embeddingURI}
          onChange={(e) => setEmbeddingURI(e.target.value)}
          disabled={hasAgent}
        />
        <Input
          placeholder="AI Signature"
          value={aiSignature}
          onChange={(e) => setAiSignature(e.target.value)}
          disabled={hasAgent}
        />
        <Button onClick={handleMint} disabled={loading || hasAgent}>
          {hasAgent
            ? "Already minted"
            : loading
              ? "Minting..."
              : "Mint Agentic ID"}
        </Button>
      </div>

      <div className="space-y-2 border p-4 rounded-xl">
        <h3 className="font-semibold">Read Agent</h3>
        <Input
          placeholder={
            agent
              ? `Token ID (default #${agent.tokenId.toString()})`
              : "Token ID"
          }
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
        />
        <Button onClick={handleRead} disabled={loading}>
          Read Agent Data
        </Button>
        {agentData != null && (
          <pre className="text-xs overflow-auto rounded-lg bg-muted p-3 max-h-48">
            {JSON.stringify(
              agentData,
              (_, v) => (typeof v === "bigint" ? v.toString() : v),
              2
            )}
          </pre>
        )}
      </div>

      <div className="space-y-2 border p-4 rounded-xl">
        <h3 className="font-semibold">Update Metadata</h3>
        <Input
          placeholder="New encrypted hash"
          value={newEncryptedHash}
          onChange={(e) => setNewEncryptedHash(e.target.value)}
        />
        <Button onClick={handleUpdateMetadata} disabled={loading}>
          Update Metadata
        </Button>
      </div>

      <div className="space-y-2 border p-4 rounded-xl">
        <h3 className="font-semibold">Update Profile</h3>
        <Input
          placeholder="Embedding URI"
          value={newEmbeddingURI}
          onChange={(e) => setNewEmbeddingURI(e.target.value)}
        />
        <Input
          placeholder="AI Signature"
          value={newAiSignature}
          onChange={(e) => setNewAiSignature(e.target.value)}
        />
        <Button onClick={handleUpdateProfile} disabled={loading}>
          Update Profile
        </Button>
      </div>
    </div>
  );
}
