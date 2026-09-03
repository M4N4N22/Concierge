import type { SpecialistDefinition } from "@/lib/specialists/types";

export type SpecialistPromptContext = {
  specialist: SpecialistDefinition;
  displayName?: string | null;
  bio?: string | null;
  knowledgeLines: string[];
  userMessage: string;
};

/** Build a Compute-ready prompt: specialist role + optional personality + filtered knowledge. */
export function buildSpecialistInferencePrompt(
  ctx: SpecialistPromptContext
): string {
  const who = ctx.displayName?.trim();
  const bio = ctx.bio?.trim();
  const identity = [
    who ? `Owner display name: ${who}` : null,
    bio ? `Owner bio: ${bio}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const knowledge =
    ctx.knowledgeLines.length > 0
      ? ctx.knowledgeLines.join("\n")
      : "(No matching vault knowledge yet — ask the user to feed relevant files.)";

  return `${ctx.specialist.systemPrompt}

${identity ? `Owner identity:\n${identity}\n` : ""}Specialist: ${ctx.specialist.label} (${ctx.specialist.id})
Domain: ${ctx.specialist.domain}

Vault knowledge for this specialist:
${knowledge}

User message:
${ctx.userMessage.trim()}`;
}

export function formatKnowledgeLines(
  items: Array<{ category: string; summary?: string; label?: string }>
): string[] {
  return items.map((item, i) => {
    const title = item.label || item.category || `file-${i + 1}`;
    const summary = (item.summary || "No summary").slice(0, 400);
    return `${i + 1}. [${item.category}] ${title}\n   ${summary}`;
  });
}
