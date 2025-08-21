// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { uploadFileTo0G } from "@/lib/0gStorage";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    if (!files.length) return NextResponse.json({ error: "No files provided" }, { status: 400 });

    const uploaded = [];
    for (const file of files) {
      const { fileName, rootHash } = await uploadFileTo0G(file);
      uploaded.push({ fileName, rootHash });
    }

    return NextResponse.json({ uploaded });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: (err as Error).message || "Upload failed" }, { status: 500 });
  }
}
