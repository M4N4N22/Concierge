import type { LucideIcon } from "lucide-react";
import {
  Upload,
  Sparkles,
  MessageSquare,
  Fingerprint,
  CandlestickChart,
  Store,
} from "lucide-react";

export type JourneyStepId =
  | "upload"
  | "insights"
  | "chat"
  | "agentic-id"
  | "trading"
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

/**
 * Concierge journey: vault → intelligence → talk → own the agent → trade → ecosystem.
 * Agentic ID (formerly INFT) sits before Trading so ownership precedes desk use.
 */
export const JOURNEY_STEPS: JourneyStep[] = [
  {
    id: "upload",
    step: 1,
    title: "Vault",
    shortTitle: "Vault",
    tagline: "Ingest wallet, CSV, and briefing evidence",
    description:
      "Add schema-first evidence packs to your vault on 0G Storage. Wallet history, CSV exports, and paste briefings normalize into facts agents can use.",
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
    title: "Talk",
    shortTitle: "Talk",
    tagline: "Ask about your vault — not trading",
    description:
      "Chat with vault evidence about spend, activity, and documents. Trading and finance live under Trading & Finance.",
    href: "/dashboard/advisor/talk",
    icon: MessageSquare,
    status: "live",
  },
  {
    id: "agentic-id",
    step: 4,
    title: "Agentic ID",
    shortTitle: "Agentic ID",
    tagline: "Mint your on-chain AI agent identity",
    description:
      "Mint an Agentic ID (formerly INFT) bound to your vault. Encrypted metadata fingerprints your Concierge intelligence on 0G Chain — then use Talk, Desk, and Ecosystem.",
    href: "/dashboard/agent/mint",
    icon: Fingerprint,
    status: "live",
    subSteps: [
      {
        id: "mint",
        name: "Mint",
        href: "/dashboard/agent/mint",
        description: "Mint your Agentic ID on 0G Chain",
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
    id: "trading",
    step: 5,
    title: "Trading & Finance",
    shortTitle: "Trading",
    tagline: "Desk, agents, and strategies",
    description:
      "Simple OG/USDC desk with agent Buy/Sell/Hold suggestions, plus a strategy builder for structured plays.",
    href: "/dashboard/trading",
    icon: CandlestickChart,
    status: "live",
    subSteps: [
      {
        id: "desk",
        name: "Desk",
        href: "/dashboard/trading/desk",
        description: "Balances, agent suggest, quote & confirm",
      },
      {
        id: "strategies",
        name: "Strategies",
        href: "/dashboard/trading/strategies",
        description: "Spot templates live · options spreads soon",
      },
    ],
  },
  {
    id: "ecosystem",
    step: 6,
    title: "Ecosystem",
    shortTitle: "Ecosystem",
    tagline: "List, rent, or transfer Agentic IDs",
    description:
      "Marketplace, rentals, and P2P transfer for data-backed Agentic IDs — list, rent access without surrendering ownership, or transfer with intelligence intact.",
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
        id: "transfer",
        name: "Transfer",
        href: "/dashboard/ecosystem/trade",
        description: "Transfer Agentic IDs with intelligence intact",
      },
    ],
  },
];

export function getStepById(id: JourneyStepId): JourneyStep | undefined {
  return JOURNEY_STEPS.find((s) => s.id === id);
}

export function getStepByPath(pathname: string): JourneyStep | undefined {
  for (const step of JOURNEY_STEPS) {
    if (step.href && pathname.startsWith(step.href)) return step;
    if (
      step.subSteps?.some(
        (s) => s.href !== "#" && pathname.startsWith(s.href)
      )
    ) {
      return step;
    }
  }
  if (pathname.startsWith("/dashboard/advisor")) {
    return JOURNEY_STEPS.find((s) => s.id === "chat");
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
