import { NextRequest, NextResponse } from "next/server";
import { uploadFileTo0G } from "@/lib/0gStorage";
import { run0GInference } from "@/lib/0gCompute";
import { parseComputeChainId } from "@/lib/computeBroker";
import { classifyComputeError } from "@/lib/computeErrors";
import {
  buildInsightsPrompt,
  parseInsightsOutput,
} from "@/lib/computeInsightsPrompt";

function failCompute(raw: unknown, status = 503) {
  const classified = classifyComputeError(raw);
  return NextResponse.json(
    {
      error: classified.message,
      code: classified.code,
      title: classified.title,
      action: classified.action,
      detail: classified.raw,
    },
    { status }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rootHash, fileName, content } = body;
    const chainId = parseComputeChainId(body.chainId);

    if (!rootHash || !fileName || !content) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const prompt = buildInsightsPrompt(content);
    const aiOutput = await run0GInference(prompt, chainId);
    const { category, summary } = parseInsightsOutput(aiOutput);

    const categoryFile = new File(
      [category],
      `${fileName}-category.txt`,
      { type: "text/plain" }
    );
    const summaryFile = new File(
      [summary],
      `${fileName}-summary.txt`,
      { type: "text/plain" }
    );

    const { rootHash: categoryCID } = await uploadFileTo0G(categoryFile);
    const { rootHash: insightsCID } = await uploadFileTo0G(summaryFile);

    return NextResponse.json({
      rootHash,
      category,
      summary,
      categoryCID,
      insightsCID,
    });
  } catch (err) {
    console.error("[computeInsights]", err);
    return failCompute(err);
  }
}
