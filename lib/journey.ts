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
  | "ecosystem"
  | "trading";

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
  status: "live" | "coming-soon" | "secondary";
  subSteps?: JourneySubStep[];
}

/**
 * Concierge spine: vault → knowledge → chat → own ID → ecosystem.
 * Trading is secondary — same Concierge, trading mode — not the core loop.
 */
export const JOURNEY_STEPS: JourneyStep[] = [
  {
    id: "upload",
    step: 1,
    title: "Vault",
    shortTitle: "Vault",
    tagline: "Store files on 0G",
    description:
      "Uploads land on 0G Storage and your Vault registry. Use Quick add for structured packs Chat can read immediately, or upload files and run Insights next.",
    href: "/dashboard/vault/my-files",
    icon: Upload,
    status: "live",
  },
  {
    id: "insights",
    step: 2,
    title: "Insights",
    shortTitle: "Insights",
    tagline: "Turn storage into agent knowledge",
    description:
      "Fund 0G Compute, then categorize and summarize vault files. Stored-only uploads become agent knowledge chat can use.",
    href: "/dashboard/vault/insights",
    icon: Sparkles,
    status: "live",
  },
  {
    id: "chat",
    step: 3,
    title: "Chat",
    shortTitle: "Chat",
    tagline: "Ask what your vault knows",
    description:
      "One Concierge workspace — questions grounded in your uploads and Insights. Tips suggest what to ask based on recent vault data.",
    href: "/dashboard/advisor/chat",
    icon: MessageSquare,
    status: "live",
  },
  {
    id: "agentic-id",
    step: 4,
    title: "Agentic ID",
    shortTitle: "Agentic ID",
    tagline: "Your portable personality",
    description:
      "Mint one Agentic ID per wallet — digital fingerprint and ownership of your Concierge. Name, bio, vault seal. Knowledge stays in the live vault; chat uses it without reminting.",
    href: "/dashboard/agent/mint",
    icon: Fingerprint,
    status: "live",
  },
  {
    id: "ecosystem",
    step: 5,
    title: "Ecosystem",
    shortTitle: "Ecosystem",
    tagline: "List, rent, or transfer",
    description:
      "Marketplace sale, timed Concierge rentals (keep ownership; renters get personality access, not your Drive dump), or free P2P transfer — vault binding travels with the token.",
    href: "/dashboard/ecosystem",
    icon: Store,
    status: "live",
    subSteps: [
      {
        id: "marketplace",
        name: "Marketplace",
        href: "/dashboard/ecosystem/marketplace",
        description: "Buy or sell Concierge Agentic IDs",
      },
      {
        id: "rent",
        name: "Rent",
        href: "/dashboard/ecosystem/rent",
        description: "Share timed Concierge access — not a private file dump",
      },
      {
        id: "transfer",
        name: "Transfer",
        href: "/dashboard/ecosystem/trade",
        description: "Send your Agentic ID P2P — no marketplace fee",
      },
    ],
  },
  {
    id: "trading",
    step: 6,
    title: "Trading desk",
    shortTitle: "Trading",
    tagline: "Secondary · same Concierge",
    description:
      "Optional desk for OG/USDC suggestions from your Concierge. Core product is vault → knowledge → chat → Agentic ID.",
    href: "/dashboard/trading",
    icon: CandlestickChart,
    status: "secondary",
    subSteps: [
      {
        id: "desk",
        name: "Desk",
        href: "/dashboard/trading/desk",
        description: "Balances and agent Buy/Sell/Hold suggest",
      },
      {
        id: "strategies",
        name: "Strategies",
        href: "/dashboard/trading/strategies",
        description: "Strategy templates · still maturing",
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

/** Next step in the core spine (skips secondary trading). */
export function getNextStep(currentId: JourneyStepId): JourneyStep | undefined {
  const core = JOURNEY_STEPS.filter((s) => s.status !== "secondary");
  const idx = core.findIndex((s) => s.id === currentId);
  if (idx < 0 || idx >= core.length - 1) return undefined;
  return core[idx + 1];
}

export function getPrevStep(currentId: JourneyStepId): JourneyStep | undefined {
  const core = JOURNEY_STEPS.filter((s) => s.status !== "secondary");
  const idx = core.findIndex((s) => s.id === currentId);
  if (idx <= 0) return undefined;
  return core[idx - 1];
}

/** Match pathname to a specific nav href (step or sub-step). */
export function isPathActive(pathname: string, href: string): boolean {
  if (href === "#") return false;
  return pathname === href || pathname.startsWith(href + "/");
}
