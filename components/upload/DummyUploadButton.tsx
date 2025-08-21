"use client";

import { useAccount } from "wagmi";
import { DUMMY_CONTENTS, uploadFileSafe } from "@/utils/upload";
import { useAddToVault } from "@/hooks/useAddToVault";

export default function DummyUploadButton({
  onUpload,
  loading,
  setLoading,
}: any) {
  const { isConnected } = useAccount();
  const { addFile } = useAddToVault();
  const emptyBytes32 = "0x" + "00".repeat(32);

  const handleDummyUpload = async () => {
    if (!isConnected)
      return alert("Please connect your wallet before uploading dummy files.");

    setLoading(true);
    const uploaded: { file: File; rootHash: string; txHash: string }[] = [];

    for (let i = 0; i < DUMMY_CONTENTS.length; i++) {
      const content = DUMMY_CONTENTS[i];
      const file = new File([content], `dummy_file_${i + 1}.txt`, {
        type: "text/plain",
      });

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
          insightsCID: emptyBytes32,
        });
        uploaded.push({ file, rootHash, txHash });
      } catch (err) {
        console.error("Dummy upload error:", err);
      }
    }

    onUpload(uploaded);
    setLoading(false);
  };

  return (
    <button
      className={`w-full font-medium py-2 rounded-xl transition ${
        isConnected
          ? "bg-foreground text-background hover:bg-foreground/90"
          : "bg-gray-300 text-gray-500 cursor-not-allowed"
      }`}
      onClick={handleDummyUpload}
      disabled={loading || !isConnected}
    >
      {!isConnected
        ? "Connect Wallet to Use Dummy Files"
        : loading
        ? "Uploading dummy files..."
        : "Test with Dummy Files"}
    </button>
  );
}
