"use client";

import { useState } from "react";
import UploadButton from "../upload/UploadButton";
import DummyUploadButton from "../upload/DummyUploadButton";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { DUMMY_CONTENTS } from "@/utils/upload";

interface UploadedFile {
  file: File;
  rootHash: string;
  txHash: string;
  content?: string;
}

export default function UploadArea() {
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const handleUpload = async (files: UploadedFile[]) => {
    const filesWithContent = await Promise.all(
      files.map(async (file) => ({
        ...file,
        content: file.file.type.startsWith("text") ? await file.file.text() : undefined
      }))
    );
    setUploadedFiles(prev => [...prev, ...filesWithContent]);
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 p-4">
      {/* Left panel: Upload sources */}
      <div className="md:w-2/3 space-y-4 bg-card p-6  rounded-2xl">
        <h2 className="text-lg font-semibold">Sources</h2>
        <UploadButton onUpload={handleUpload} loading={loading} setLoading={setLoading} />
        <DummyUploadButton onUpload={handleUpload} loading={loading} setLoading={setLoading} />
      </div>

      {/* Right panel: Preview */}
      <div className="md:w-1/3 space-y-4 ">
        {/* Dummy files preview */}
        <Accordion type="single" collapsible className="w-full bg-card px-6 py-2 rounded-2xl">
          <AccordionItem value="dummy-files">
            <AccordionTrigger>Dummy File Preview</AccordionTrigger>
            <AccordionContent className="space-y-2">
              {DUMMY_CONTENTS.map((content, index) => (
                <pre key={index} className="whitespace-pre-wrap break-words  p-2 rounded">
                  {content}
                </pre>
              ))}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Real uploaded files preview */}
        <div className="bg-card p-6 rounded-2xl">
          <h2 className="text-lg font-semibold mb-2">Uploaded Files</h2>
          {uploadedFiles.length === 0 ? (
            <p className="text-muted">No files uploaded yet</p>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {uploadedFiles.map((file, index) => (
                <AccordionItem key={index} value={`file-${index}`}>
                  <AccordionTrigger>{file.file.name}</AccordionTrigger>
                  <AccordionContent>
                    <pre className="whitespace-pre-wrap break-words">
                      {file.content ?? "Binary file cannot preview"}
                    </pre>
                    <p className="mt-2 text-sm text-gray-500">
                      RootHash: {file.rootHash} <br />
                      TxHash: {file.txHash}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </div>
    </div>
  );
}
