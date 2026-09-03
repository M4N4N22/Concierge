export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { uploadFileTo0G, resolveStorageChainId } from "@/lib/0gStorage";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    if (!files.length)
      return NextResponse.json({ error: "No files provided" }, { status: 400 });

    const rawChain = formData.get("chainId");
    const chainId = resolveStorageChainId(
      rawChain != null && String(rawChain).length
        ? Number(rawChain)
        : null
    );

    const uploaded = [];
    for (const file of files) {
      const { fileName, rootHash, alreadyExists } = await uploadFileTo0G(
        file,
        chainId
      );
      uploaded.push({ fileName, rootHash, alreadyExists, chainId });
    }

    return NextResponse.json({ uploaded, chainId });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: (err as Error).message || "Upload failed" },
      { status: 500 }
    );
  }
}
