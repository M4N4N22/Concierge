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
    title: "Upload your data",
    shortTitle: "Upload",
    tagline: "Manual upload or connect external sources",
    description:
      "Add documents to your private vault on 0G Storage. Files are encrypted and registered on-chain.",
    href: "/dashboard/vault/my-files",
    icon: Upload,
    status: "live",
  },
  {
    id: "insights",
    step: 2,
    title: "AI organizes your vault",
    shortTitle: "Insights",
    tagline: "Categorize, group, and summarize",
    description:
      "0G Compute reads your files, assigns categories, and generates concise summaries stored back on-chain.",
    href: "/dashboard/vault/insights",
    icon: Sparkles,
    status: "live",
  },
  {
    id: "chat",
    step: 3,
    title: "Talk to your data",
    shortTitle: "Chat",
    tagline: "Ask questions across your vault",
    description:
      "Chat with an AI that only knows your documents — private, contextual answers from your vault.",
    href: "/dashboard/vault/chat",
    icon: MessageSquare,
    status: "coming-soon",
  },
  {
    id: "agentic-id",
    step: 4,
    title: "Mint your Agentic ID",
    shortTitle: "Agentic ID",
    tagline: "Your onchain AI agent, trained on you",
    description:
      "Tokenize your personal agent on 0G Chain. One vault powers domain agents that learn from your data.",
    href: "/dashboard/agent/mint",
    icon: Fingerprint,
    status: "live",
    subSteps: [
      {
        id: "mint",
        name: "Mint Agent",
        href: "/dashboard/agent/mint",
        description: "Create your Agentic ID bound to your vault",
      },
      {
        id: "learning",
        name: "Domain Learning",
        href: "/dashboard/agent/learning",
        description: "Finance, travel, and subscription agents",
      },
      {
        id: "recommendations",
        name: "Recommendations",
        href: "/dashboard/agent/recommendations",
        description: "Actionable insights per domain",
      },
    ],
  },
  {
    id: "ecosystem",
    step: 5,
    title: "Agent ecosystem",
    shortTitle: "Ecosystem",
    tagline: "Train, trade, rent, and monetize",
    description:
      "Marketplace for specialized agents, delegation, and Agent-as-a-Service — built on ERC-7857.",
    icon: Store,
    status: "coming-soon",
    subSteps: [
      {
        id: "marketplace",
        name: "Marketplace",
        href: "#",
        description: "Discover and acquire data-backed agents",
      },
      {
        id: "rent",
        name: "Rent & Delegate",
        href: "#",
        description: "Share agent access without giving up ownership",
      },
      {
        id: "trade",
        name: "Trade Agents",
        href: "#",
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
