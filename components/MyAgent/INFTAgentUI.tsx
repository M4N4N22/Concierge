// components/INFTAgentUI.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useINFTAgent } from "@/hooks/useINFTAgent";

export default function INFTAgentUI() {
  const {
    mintAgent,
    getAgentProfile,
    getEncryptedMetadata,
    updateMetadata,
    updateProfile,
  } = useINFTAgent();

  const [vault, setVault] = useState("");
  const [encryptedHash, setEncryptedHash] = useState("");
  const [domain, setDomain] = useState("");
  const [embeddingURI, setEmbeddingURI] = useState("");
  const [aiSignature, setAiSignature] = useState("");

  const [agentId, setAgentId] = useState("");
  const [newEncryptedHash, setNewEncryptedHash] = useState("");
  const [newEmbeddingURI, setNewEmbeddingURI] = useState("");
  const [newAiSignature, setNewAiSignature] = useState("");
  const [agentData, setAgentData] = useState<any>(null);

  const [loading, setLoading] = useState(false);

  // 🧠 Mint new agent
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
      alert(`Agent minted successfully!\nTx: ${tx}`);
    } catch (err) {
      console.error(err);
      alert("Mint failed — check console for details.");
    } finally {
      setLoading(false);
    }
  };

  // 🧩 Read agent profile and metadata
  const handleRead = async () => {
    setLoading(true);
    try {
      const profile = await getAgentProfile(BigInt(agentId));
      const metadata = await getEncryptedMetadata(BigInt(agentId));
      setAgentData({ profile, metadata });
    } catch (err) {
      console.error(err);
      alert("Failed to fetch agent details");
    } finally {
      setLoading(false);
    }
  };

  // ✏️ Update encrypted metadata
  const handleUpdateMetadata = async () => {
    setLoading(true);
    try {
      const tx = await updateMetadata(
        BigInt(agentId),
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

  // 🧬 Update profile
  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const tx = await updateProfile(
        BigInt(agentId),
        newEmbeddingURI,
        newAiSignature
      );
      alert(`Profile updated successfully!\nTx: ${tx}`);
    } catch (err) {
      console.error(err);
      alert("Profile update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-xl mx-auto">
      <h2 className="text-xl font-bold text-center">INFT Agent Manager</h2>

      {/* Mint Agent */}
      <div className="space-y-2 border p-4 rounded-xl">
        <h3 className="font-semibold">Mint New Agent</h3>
        <Input placeholder="Vault Address" value={vault} onChange={(e) => setVault(e.target.value)} />
        <Input placeholder="Encrypted Hash (0x...)" value={encryptedHash} onChange={(e) => setEncryptedHash(e.target.value)} />
        <Input placeholder="Domain" value={domain} onChange={(e) => setDomain(e.target.value)} />
        <Input placeholder="Embedding URI" value={embeddingURI} onChange={(e) => setEmbeddingURI(e.target.value)} />
        <Input placeholder="AI Signature" value={aiSignature} onChange={(e) => setAiSignature(e.target.value)} />
        <Button onClick={handleMint} disabled={loading}>
          {loading ? "Minting..." : "Mint Agent"}
        </Button>
      </div>

      {/* Read Agent */}
      <div className="space-y-2 border p-4 rounded-xl">
        <h3 className="font-semibold">Read Agent Data</h3>
        <Input placeholder="Agent ID" value={agentId} onChange={(e) => setAgentId(e.target.value)} />
        <Button onClick={handleRead} disabled={loading}>
          {loading ? "Fetching..." : "Get Agent Info"}
        </Button>

        {agentData && (
          <pre className="bg-gray-900 text-white p-3 rounded-lg text-sm overflow-auto max-h-64">
            {JSON.stringify(agentData, null, 2)}
          </pre>
        )}
      </div>

      {/* Update Metadata */}
      <div className="space-y-2 border p-4 rounded-xl">
        <h3 className="font-semibold">Update Encrypted Metadata</h3>
        <Input placeholder="New Encrypted Hash (0x...)" value={newEncryptedHash} onChange={(e) => setNewEncryptedHash(e.target.value)} />
        <Button onClick={handleUpdateMetadata} disabled={loading}>
          {loading ? "Updating..." : "Update Metadata"}
        </Button>
      </div>

      {/* Update Profile */}
      <div className="space-y-2 border p-4 rounded-xl">
        <h3 className="font-semibold">Update Profile</h3>
        <Input placeholder="New Embedding URI" value={newEmbeddingURI} onChange={(e) => setNewEmbeddingURI(e.target.value)} />
        <Input placeholder="New AI Signature" value={newAiSignature} onChange={(e) => setNewAiSignature(e.target.value)} />
        <Button onClick={handleUpdateProfile} disabled={loading}>
          {loading ? "Updating..." : "Update Profile"}
        </Button>
      </div>
    </div>
  );
}
