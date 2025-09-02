"use client";

import { Upload } from "lucide-react";
import { useAccount } from "wagmi";
import { uploadFileSafe } from "@/utils/upload";
import { useAddToVault } from "@/hooks/useAddToVault";
import { useState, useRef } from "react";

type UploadedFile = {
  file: File;
  rootHash?: string;
  txHash?: string;
};

type FolderPreview = {
  folderName: string;
  files: File[];
};

export default function UploadButton({ onUpload, loading, setLoading }: any) {
  const { isConnected } = useAccount();
  const { addFile } = useAddToVault();
  const [folderPreviews, setFolderPreviews] = useState<FolderPreview[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const groupFilesByFolder = (files: FileList | File[]) => {
    const arrayFiles = Array.from(files);
    const folders: Record<string, File[]> = {};

    arrayFiles.forEach((file) => {
      const fullPath = (file as any).webkitRelativePath || file.name;
      const parts = fullPath.split("/");
      const folderName = parts.length > 1 ? parts[0] : "Root";
      if (!folders[folderName]) folders[folderName] = [];
      folders[folderName].push(file);
    });

    const folderArray: FolderPreview[] = Object.entries(folders).map(([folderName, files]) => ({
      folderName,
      files,
    }));

    setFolderPreviews(folderArray);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    groupFilesByFolder(e.target.files);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files) {
      groupFilesByFolder(e.dataTransfer.files);
    }
  };

  const handleUpload = async () => {
    if (!isConnected) {
      alert("Please connect your wallet before uploading.");
      return;
    }

    setLoading(true);
    const uploaded: UploadedFile[] = [];

    const allFiles = folderPreviews.flatMap((f) => f.files);

    for (const file of allFiles) {
      try {
        const result = await uploadFileSafe(file);
        if (!result) continue;

        const { rootHash, alreadyExists } = result;
        if (alreadyExists) {
          uploaded.push({ file, rootHash });
          continue;
        }

        const txHash = await addFile({
          rootHash,
          category: "unassigned",
          encryptedKey: "",
          insightsCID: rootHash,
        });

        uploaded.push({ file, rootHash, txHash });
      } catch (err) {
        console.error("Upload error:", err);
      }
    }

    onUpload(uploaded);
    setFolderPreviews([]);
    setLoading(false);
  };

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={(e) => e.preventDefault()}
        className={`border-2 border-dashed rounded-2xl hover:border-primary p-12 text-center transition mb-4 ${
          isConnected ? "cursor-pointer hover:bg-card" : "opacity-50 cursor-not-allowed"
        }`}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleChange}
          disabled={!isConnected}
        />
        <div className="flex flex-col items-center">
          <Upload className="h-8 w-8 mb-2" />
          <span className="font-medium mt-4">
            {!isConnected
              ? "Connect Wallet to Upload"
              : loading
              ? "Uploading..."
              : "Drag & Drop or Click to Upload Files"}
          </span>
        </div>
      </div>

      {folderPreviews.length > 0 && (
        <div className="mb-4 p-4 border rounded-lg bg-card space-y-4">
          {folderPreviews.map((folder, idx) => (
            <div key={idx} className="border p-3 rounded-lg">
              <h4 className="font-semibold">
                {folder.folderName} ({folder.files.length} files)
              </h4>
              <ul className="mt-2 space-y-1 max-h-48 overflow-auto">
                {folder.files.slice(0, 10).map((file, i) => (
                  <li key={i} className="flex justify-between text-sm">
                    <span>{file.name}</span>
                    <span className="text-muted">{(file.size / 1024).toFixed(2)} KB</span>
                  </li>
                ))}
                {folder.files.length > 10 && (
                  <li className="text-gray-400 text-sm">...and {folder.files.length - 10} more</li>
                )}
              </ul>
            </div>
          ))}
          <button
            onClick={handleUpload}
            className="mt-4 px-4 py-2 bg-foreground w-full text-background font-semibold rounded-2xl hover:bg-foreground/90 transition"
          >
            Ready to Upload
          </button>
        </div>
      )}
    </div>
  );
}
