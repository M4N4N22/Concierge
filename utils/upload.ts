import { toast } from "sonner";

export const uploadFileSafe = async (
  file: File
): Promise<{ rootHash: string } | null> => {
  const formData = new FormData();
  formData.append("files", file);

  let res: Response;
  let data: any;

  try {
    res = await fetch("/api/uploadFile", { method: "POST", body: formData });
    data = await res.json();

    if (!res.ok) {
      console.warn(`Upload failed for ${file.name}:`, data?.error);
      toast.error(
        `Upload failed for ${file.name}: ${data?.error || "Unknown error"}`
      );
      return null;
    }

    const item = data.uploaded?.[0];
    if (!item?.rootHash) {
      toast.error(`No rootHash returned for file: ${file.name}`);
      return null;
    }

    console.log(
      "Upload succeeded for file:",
      file.name,
      "rootHash:",
      item.rootHash
    );
    toast.success(`Upload succeeded for file: ${file.name}`);
    return { rootHash: item.rootHash };
  } catch (err: any) {
    console.error("Error during fetch/upload:", err);
    toast.error(
      `Upload error for ${file.name}: ${err?.message || "Unknown error"}`
    );
    return null;
  }
};

export const DUMMY_CONTENTS = [
  `Netflix receipt for subscription renewal on 2025-10-01.
`,
];
