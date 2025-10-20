"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

// --- Mock uploaded files ---
const MOCK_FILES = [
  {
    rootHash: "0x63b7...7a3785",
    name: "Medical Bill.pdf",
    type: "medical",
    timestamp: "10/7/2025, 12:36:57 PM",
  },
  {
    rootHash: "0x21f2...9acbe1",
    name: "Netflix Receipt.pdf",
    type: "entertainment",
    timestamp: "10/10/2025, 09:12:33 AM",
  },
  {
    rootHash: "0x7e8a...c123ff",
    name: "Work Doc.docx",
    type: "work",
    timestamp: "10/11/2025, 02:14:21 PM",
  },
  {
    rootHash: "0x9b1c...f55a22",
    name: "Medical Report.pdf",
    type: "medical",
    timestamp: "10/12/2025, 05:47:10 PM",
  },
  {
    rootHash: "0xa9b3...e7732f",
    name: "Utility Bill.pdf",
    type: "finance",
    timestamp: "10/13/2025, 08:22:05 AM",
  },
  {
    rootHash: "0x11aa...bb4455",
    name: "Cafe Receipt.jpg",
    type: "entertainment",
    timestamp: "10/14/2025, 11:10:32 AM",
  },
  {
    rootHash: "0x22bb...cc5566",
    name: "Blood Test.pdf",
    type: "medical",
    timestamp: "10/14/2025, 03:22:05 PM",
  },
  {
    rootHash: "0x33cc...dd6677",
    name: "Electricity Bill.pdf",
    type: "finance",
    timestamp: "10/15/2025, 06:35:10 PM",
  },
  {
    rootHash: "0x44dd...ee7788",
    name: "Travel Itinerary.docx",
    type: "personal",
    timestamp: "10/15/2025, 07:12:48 PM",
  },
  {
    rootHash: "0x55ee...ff8899",
    name: "Gym Invoice.pdf",
    type: "fitness",
    timestamp: "10/16/2025, 09:25:45 AM",
  },
  {
    rootHash: "0x66ff...aa9911",
    name: "Spotify Receipt.pdf",
    type: "entertainment",
    timestamp: "10/16/2025, 10:22:11 AM",
  },
  {
    rootHash: "0x77gg...bb0022",
    name: "Insurance Policy.pdf",
    type: "finance",
    timestamp: "10/17/2025, 01:05:29 PM",
  },
  {
    rootHash: "0x88hh...cc1133",
    name: "Work Notes.txt",
    type: "work",
    timestamp: "10/18/2025, 04:20:51 PM",
  },
  {
    rootHash: "0x99ii...dd2244",
    name: "Credit Card Bill.pdf",
    type: "finance",
    timestamp: "10/19/2025, 11:59:10 AM",
  },
  {
    rootHash: "0x00jj...ee3355",
    name: "Flight Receipt.pdf",
    type: null,
    timestamp: "10/19/2025, 05:45:20 PM",
  },
];

// --- Mock AI summaries for already categorized files ---
const MOCK_AI_SUMMARIES = {
  medical: [
    {
      name: "Medical Bill.pdf",
      summary: "Hospital visit on 10/7: $350 billed",
    },
    { name: "Medical Report.pdf", summary: "Lab report: Blood tests normal" },
  ],
  entertainment: [
    {
      name: "Netflix Receipt.pdf",
      summary: "Monthly Netflix subscription $14.99",
    },
    { name: "Cafe Receipt.jpg", summary: "Cafe Latte & Croissant $8.50" },
  ],
  finance: [
    {
      name: "Utility Bill.pdf",
      summary: "Electricity bill for September: $60",
    },
  ],
};

export default function DemoVaultWizard() {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [step, setStep] = useState<"upload" | "compute" | "result">("upload");
  const [progress, setProgress] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Simulated AI computation with step-wise progress
  useEffect(() => {
    if (!loading) return;
    let current = 0;
    const interval = setInterval(() => {
      current++;
      setProgress(current);
      if (current >= selectedFiles.length) {
        clearInterval(interval);
        setTimeout(() => {
          setLoading(false);
          setStep("result");
        }, 500);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [loading, selectedFiles.length]);

  const toggleFileSelection = (hash: string) => {
    setSelectedFiles((prev) =>
      prev.includes(hash) ? prev.filter((h) => h !== hash) : [...prev, hash]
    );
  };

  const runCompute = () => {
    if (!selectedFiles.length) return;
    setProgress(0);
    setLoading(true);
  };

  // Determine categorized vs uncategorized
  const categorizedNames = Object.values(MOCK_AI_SUMMARIES)
    .flat()
    .map((f) => f.name);
  const uncategorizedFiles = MOCK_FILES.filter(
    (f) => !categorizedNames.includes(f.name)
  );

  // Combine all summaries after compute
  const groupedResults: Record<
    string,
    { name: string; summary: string; rootHash: string }[]
  > = {};

  // Step 1: Add pre-categorized mock summaries
  Object.entries(MOCK_AI_SUMMARIES).forEach(([category, files]) => {
    groupedResults[category] = files.map((f) => {
      const match = MOCK_FILES.find((mf) => mf.name === f.name);
      return {
        name: f.name,
        summary: f.summary,
        rootHash: match?.rootHash ?? `${category}-${f.name}`, // ensures unique key
      };
    });
  });

  // Step 2: Add newly AI-computed summaries for selected files
  if (step === "result") {
    selectedFiles.forEach((hash) => {
      const file = MOCK_FILES.find((f) => f.rootHash === hash);
      if (!file) return;

      const category = file.type || "general";
      const summary = `AI Summary for ${file.name}: Organized into "${category}" category.`;

      if (!groupedResults[category]) groupedResults[category] = [];

      // Avoid duplicates
      if (!groupedResults[category].some((f) => f.rootHash === hash)) {
        groupedResults[category].push({
          name: file.name,
          summary,
          rootHash: file.rootHash,
        });
      }
    });
  }

  return (
    <div className="space-y-6">
      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle>Your Uploaded Files</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              You have{" "}
              <span className="font-semibold text-primary">
                {uncategorizedFiles.length}
              </span>{" "}
              uncategorized & unsummarized files. Get AI Insights to organize
              your data automatically.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {MOCK_FILES.map((file) => {
                const isCategorized = categorizedNames.includes(file.name);
                return (
                  <div
                    key={file.rootHash}
                    className={`flex items-center justify-between p-6 border rounded-xl shadow-sm transition hover:bg-gray-50 ${
                      isCategorized
                        ? "bg-green-50 border-green-200"
                        : "border-muted/30"
                    }`}
                  >
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {file.rootHash} | {file.timestamp}
                      </p>
                      {isCategorized && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ Already Categorized
                        </p>
                      )}
                    </div>
                    {!isCategorized && (
                      <Checkbox
                        checked={selectedFiles.includes(file.rootHash)}
                        onCheckedChange={() =>
                          toggleFileSelection(file.rootHash)
                        }
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-6">
              <Button
                onClick={runCompute}
                disabled={!selectedFiles.length || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Generating Insights {progress}/{selectedFiles.length}
                  </>
                ) : (
                  "Get AI Insights"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "result" && (
        <Tabs defaultValue="all" className="space-y-4 p-6">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            {Object.keys(groupedResults).map((category) => (
              <TabsTrigger key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* All Files */}
          <TabsContent value="all">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.values(groupedResults)
                .flat()
                .map((file) => (
                  <Card key={`${file.name}-${file.rootHash ?? Math.random()}`}>
                    <CardHeader>
                      <CardTitle>{file.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{file.summary}</p>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          {/* Individual Categories */}
          {Object.entries(groupedResults).map(([category, files]) => (
            <TabsContent key={category} value={category}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map((file) => (
                  <Card key={file.name}>
                    <CardHeader>
                      <CardTitle>{file.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{file.summary}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}

          <div className="flex justify-end pt-6">
            <Button variant="default" onClick={() => setStep("upload")}>
              Back to Upload
            </Button>
          </div>
        </Tabs>
      )}
    </div>
  );
}
