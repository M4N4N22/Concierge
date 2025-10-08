"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, FileText, Cpu, Zap, CheckCircle2, Copy } from "lucide-react";

// --- Mock functions ---
const mockUploadToVault = async (fileContent: string) => {
  await new Promise((res) => setTimeout(res, 1000));
  return (
    "0x" +
    Array(64)
      .fill(0)
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join("")
  );
};

const mockComputeInsights = async (fileContent: string) => {
  await new Promise((res) => setTimeout(res, 1500));
  const categories = ["finance", "travel", "health"];
  const category = categories[Math.floor(Math.random() * categories.length)];
  return {
    category,
    summary: `Mock insights for "${fileContent.slice(0, 10)}..."`,
  };
};

const mockMintAgent = async (mintData: any) => {
  await new Promise((res) => setTimeout(res, 1000));
  return { tokenId: Math.floor(Math.random() * 1000), ...mintData };
};

export default function INFTAgentWizardMock() {
  const [step, setStep] = useState(1);

  const [fileContent, setFileContent] = useState("");
  const [vaultHash, setVaultHash] = useState("");
  const [category, setCategory] = useState("");
  const [insights, setInsights] = useState("");
  const [mintData, setMintData] = useState<any>(null);
  const [mintedAgent, setMintedAgent] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleProcessFile = async () => {
    setLoading(true);
    try {
      const rootHash = await mockUploadToVault(fileContent);
      setVaultHash(rootHash);

      const ai = await mockComputeInsights(fileContent);
      setCategory(ai.category);
      setInsights(ai.summary);

      const encryptedHash =
        "0x" +
        Array(64)
          .fill(0)
          .map(() => Math.floor(Math.random() * 16).toString(16))
          .join("");
      setMintData({
        vault: rootHash,
        encryptedHash,
        domain: `${ai.category}.ai`,
        embeddingURI: `ipfs://mockCID/${ai.category}`,
        aiSignature: `mock_model_v1.0-${ai.category}`,
      });

      toast.success("Insights generated successfully.");

      setStep(2); // Move to next step
    } catch (err) {
      console.error(err);
      toast.error("Failed to process file.");
    } finally {
      setLoading(false);
    }
  };

  const handleMintAgent = async () => {
    if (!mintData) return;
    setLoading(true);
    try {
      const agent = await mockMintAgent(mintData);
      setMintedAgent(agent);
      toast.success(`Agent minted! Token ID: ${agent.tokenId}`);

      setStep(4);
    } catch (err) {
      console.error(err);
      toast.error("Mint failed");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  return (
    <div className="max-w-3xl mx-auto p-6 flex flex-col gap-6">
      <h2 className="text-3xl font-bold text-center">INFT Agent Wizard Demo</h2>

      {/* Stepper */}
      <Progress
        value={(step / 4) * 100}
        className="h-2 rounded-lg bg-muted/20"
      />

      {/* Step 1: Upload */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Upload File &
              Generate Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Hardcoded file options */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Select a file to process:
              </p>
              <div className="flex flex-col gap-2">
                {[
                  "Financial Report Q1",
                  "Travel Guide 2025",
                  "Health Research Paper",
                ].map((file, idx) => (
                  <Button
                    key={idx}
                    variant={fileContent === file ? "default" : "outline"}
                    className="w-full text-left"
                    onClick={() => setFileContent(file)}
                  >
                    {file}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleProcessFile}
              disabled={loading || !fileContent}
              className="w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : (
                <Cpu className="w-5 h-5" />
              )}
              {loading ? "Processing..." : "Process File"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Review Insights */}
      {step === 2 && mintData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-primary" /> Review Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/10 p-4 rounded-lg space-y-1">
              <p>
                <strong>Vault Hash:</strong> {vaultHash}{" "}
                <Copy
                  className="inline w-4 h-4 cursor-pointer"
                  onClick={() => copyToClipboard(vaultHash)}
                />
              </p>
              <p>
                <strong>Category:</strong> {category}
              </p>
              <p>
                <strong>AI Insights:</strong> {insights}
              </p>
            </div>
            <Button
              onClick={() => setStep(3)}
              className="w-full flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5" /> Next: Mint Agent
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Mint Agent */}
      {step === 3 && mintData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" /> Mint Your INFT Agent
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/10 p-4 rounded-lg space-y-1">
              {Object.entries(mintData).map(([key, value]) => (
                <p key={key}>
                  <strong>{key}:</strong> {String(value)}{" "}
                  <Copy
                    className="inline w-4 h-4 cursor-pointer"
                    onClick={() => copyToClipboard(String(value))}
                  />
                </p>
              ))}
            </div>
            <Button
              onClick={handleMintAgent}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
              {loading ? "Minting..." : "Mint Agent"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 4: View Minted Agent */}
      {step === 4 && mintedAgent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" /> Minted Agent
              Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm overflow-auto max-h-64 bg-primary/10 p-3 rounded-lg">
              {JSON.stringify(mintedAgent, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
