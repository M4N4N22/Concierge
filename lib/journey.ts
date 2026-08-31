import type { LucideIcon } from "lucide-react";
import {
  Upload,
  Sparkles,
  MessageSquare,
  Fingerprint,
  Store,
} from "lucide-react";

export type JourneyStepId =
  | "upload"
  | "insights"
  | "chat"
  | "agentic-id"
  | "ecosystem";

export interface JourneySubStep {
  id: string;
  name: string;
  href: string;
  description: string;
}

export interface JourneyStep {
  id: JourneyStepId;
  step: number;
  title: string;
  shortTitle: string;
  tagline: string;
  description: string;
  href?: string;
  icon: LucideIcon;
  status: "live" | "coming-soon";
  subSteps?: JourneySubStep[];
}

export const JOURNEY_STEPS: JourneyStep[] = [
  {
    id: "upload",
    step: 1,
    title: "Vault",
    shortTitle: "Vault",
    tagline: "Ingest wallet, CSV, and briefing evidence",
    description:
      "Add schema-first evidence packs to your vault on 0G Storage. Wallet history, CSV exports, and paste briefings normalize into facts the AI board can use.",
    href: "/dashboard/vault/my-files",
    icon: Upload,
    status: "live",
  },
  {
    id: "insights",
    step: 2,
    title: "Insights",
    shortTitle: "Insights",
    tagline: "Auto-categorize and summarize vault files",
    description:
      "0G Compute reads your files, assigns categories, and generates concise summaries stored back on-chain.",
    href: "/dashboard/vault/insights",
    icon: Sparkles,
    status: "live",
  },
  {
    id: "chat",
    step: 3,
    title: "Advisor",
    shortTitle: "Advisor",
    tagline: "Talk to your data or take a trade",
    description:
      "Two separate tools powered by your vault: conversational advice about your evidence, and a mandate-gated trade desk.",
    href: "/dashboard/advisor",
    icon: MessageSquare,
    status: "live",
    subSteps: [
      {
        id: "talk",
        name: "Talk to your data",
        href: "/dashboard/advisor/talk",
        description: "Chat with vault evidence — advisory only",
      },
      {
        id: "take-trade",
        name: "Take a trade",
        href: "/dashboard/advisor/trade",
        description: "Balances, brief, mandate, and order ticket",
      },
    ],
  },
  {
    id: "agentic-id",
    step: 4,
    title: "Agentic ID",
    shortTitle: "Agentic ID",
    tagline: "Mint and bind your onchain Board Chair",
    description:
      "Mint an Agentic ID bound to your vault. Talk and Trade transcripts and firewall seals can bind back to this token.",
    href: "/dashboard/agent/mint",
    icon: Fingerprint,
    status: "live",
    subSteps: [
      {
        id: "mint",
        name: "Mint",
        href: "/dashboard/agent/mint",
        description: "Create your Agentic ID / Board Chair",
      },
      {
        id: "learning",
        name: "Learning",
        href: "/dashboard/agent/learning",
        description: "Train domain specialists on vault evidence",
      },
      {
        id: "recommendations",
        name: "Recommendations",
        href: "/dashboard/agent/recommendations",
        description: "Review actionable insights per domain",
      },
    ],
  },
  {
    id: "ecosystem",
    step: 5,
    title: "Ecosystem",
    shortTitle: "Ecosystem",
    tagline: "List, rent, or transfer data-backed agents",
    description:
      "Marketplace, rentals, and P2P trade for data-backed Agentic IDs — list, rent access without surrendering ownership, or transfer the Board Chair with intelligence intact.",
    href: "/dashboard/ecosystem",
    icon: Store,
    status: "live",
    subSteps: [
      {
        id: "marketplace",
        name: "Marketplace",
        href: "/dashboard/ecosystem/marketplace",
        description: "Discover and acquire data-backed agents",
      },
      {
        id: "rent",
        name: "Rent",
        href: "/dashboard/ecosystem/rent",
        description: "Share agent access without giving up ownership",
      },
      {
        id: "trade",
        name: "Trade",
        href: "/dashboard/ecosystem/trade",
        description: "Transfer Agentic IDs with intelligence intact",
      },
    ],
  },
];

export function getStepByPath(pathname: string): JourneyStep | undefined {
  for (const step of JOURNEY_STEPS) {
    if (step.href && pathname.startsWith(step.href)) return step;
    if (step.subSteps?.some((s) => s.href !== "#" && pathname.startsWith(s.href))) {
      return step;
    }
  }
  return undefined;
}

export function getNextStep(currentId: JourneyStepId): JourneyStep | undefined {
  const idx = JOURNEY_STEPS.findIndex((s) => s.id === currentId);
  if (idx < 0 || idx >= JOURNEY_STEPS.length - 1) return undefined;
  return JOURNEY_STEPS[idx + 1];
}

export function getPrevStep(currentId: JourneyStepId): JourneyStep | undefined {
  const idx = JOURNEY_STEPS.findIndex((s) => s.id === currentId);
  if (idx <= 0) return undefined;
  return JOURNEY_STEPS[idx - 1];
}

/** Match pathname to a specific nav href (step or sub-step). */
export function isPathActive(pathname: string, href: string): boolean {
  if (href === "#") return false;
  return pathname === href || pathname.startsWith(href + "/");
}
