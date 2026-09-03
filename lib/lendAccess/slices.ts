import type { ShareSlice, VaultShareItem } from "@/lib/lendAccess/types";
import { SHARE_SLICE_SCHEMA } from "@/lib/lendAccess/types";

/** Starter slices — shareable craft vs keep-private life data. */
export const DEFAULT_SHARE_SLICES: ShareSlice[] = [
  {
    schemaVersion: SHARE_SLICE_SCHEMA,
    id: "writing-voice",
    label: "Writing voice",
    description:
      "Drafts and samples so a guest can borrow how you write — not your inbox.",
    categoryIncludes: ["writ", "copy", "draft", "note", "blog", "content"],
    requireKnowledge: true,
    ownerOnly: false,
  },
  {
    schemaVersion: SHARE_SLICE_SCHEMA,
    id: "work-playbook",
    label: "Work playbook",
    description:
      "How you plan and decide from notes you choose to share.",
    categoryIncludes: ["work", "plan", "brief", "playbook", "project"],
    requireKnowledge: true,
    ownerOnly: false,
  },
  {
    schemaVersion: SHARE_SLICE_SCHEMA,
    id: "private-life",
    label: "Private life",
    description:
      "Bills, health, and personal money — stay with you. Never lend by default.",
    categoryIncludes: [
      "bill",
      "medical",
      "health",
      "tax",
      "bank",
      "invoice",
      "wallet",
    ],
    requireKnowledge: false,
    ownerOnly: true,
  },
];

export function getShareSlice(id: string): ShareSlice | undefined {
  return DEFAULT_SHARE_SLICES.find((s) => s.id === id);
}

export function listShareableSlices(): ShareSlice[] {
  return DEFAULT_SHARE_SLICES.filter((s) => !s.ownerOnly);
}

export function listOwnerOnlySlices(): ShareSlice[] {
  return DEFAULT_SHARE_SLICES.filter((s) => s.ownerOnly);
}

function matchesSlice(item: VaultShareItem, slice: ShareSlice): boolean {
  if (slice.requireKnowledge && !item.hasKnowledge) return false;
  const hay = `${item.category} ${item.name}`.toLowerCase();
  return slice.categoryIncludes.some((kw) => hay.includes(kw.toLowerCase()));
}

/** Vault items that would fall into a slice (preview for Wave 4 UI). */
export function filterItemsForSlice(
  items: VaultShareItem[],
  slice: ShareSlice
): VaultShareItem[] {
  return items.filter((item) => matchesSlice(item, slice));
}

export function draftShareSlice(args: {
  label: string;
  description: string;
  categoryIncludes: string[];
  ownerOnly?: boolean;
}): ShareSlice {
  const slug = args.label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return {
    schemaVersion: SHARE_SLICE_SCHEMA,
    id: `custom-${slug || "slice"}-${Date.now().toString(36)}`,
    label: args.label.trim() || "Custom slice",
    description: args.description.trim(),
    categoryIncludes: args.categoryIncludes.map((k) => k.toLowerCase()),
    requireKnowledge: true,
    ownerOnly: args.ownerOnly ?? false,
  };
}
