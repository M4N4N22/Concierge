"use client";

import { Upload } from "lucide-react";
import { useAccount } from "wagmi";
import { uploadFileSafe } from "@/utils/upload";
import { useAddToVault } from "@/hooks/useAddToVault";

export default function UploadButton({ onUpload, loading, setLoading }: any) {
  const { isConnected } = useAccount();
  const { addFile } = useAddToVault();

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    if (!isConnected)
      return alert("Please connect your wallet before uploading.");

    setLoading(true);
    const filesArray = Array.from(e.target.files);
    const uploaded: { file: File; rootHash: string; txHash: string }[] = [];

    for (const file of filesArray) {
      try {
        const result = await uploadFileSafe(file);

        if (!result) {
          console.log(`Skipping file ${file.name} due to upload failure`);
          return;
        }

        const { rootHash } = result; // 1) 0G upload (server)
        const txHash = await addFile({
          // 2) Vault write (client)
          rootHash,
          category: "unassigned",
          encryptedKey: "",
          insightsCID: rootHash, // or separate insights upload later
        });
        uploaded.push({ file, rootHash, txHash });
      } catch (err) {
        console.error("Upload error:", err);
      }
    }

    onUpload(uploaded);
    setLoading(false);
  };

  return (
    <div
      className={`border-2 border-dashed rounded-2xl p-6 text-center transition ${
        isConnected
          ? "cursor-pointer hover:bg-card"
          : "opacity-50 cursor-not-allowed"
      }`}
    >
      <input
        type="file"
        multiple
        className="hidden"
        id="file-upload"
        onChange={handleChange}
        disabled={!isConnected}
      />
      <label
        htmlFor="file-upload"
        className="cursor-pointer flex flex-col items-center"
      >
        <Upload className="h-8 w-8 mb-2" />
        <span className="font-medium">
          {!isConnected
            ? "Connect Wallet to Upload"
            : loading
            ? "Uploading..."
            : "Drag & Drop or Click to Upload"}
        </span>
      </label>
    </div>
  );
}
