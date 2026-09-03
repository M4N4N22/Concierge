"use client";

import {
  Bug,
  CircleHelp,
  Github,
  Lightbulb,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  GITHUB_ASK_QUESTION,
  GITHUB_FEATURE_REQUEST,
  GITHUB_REPORT_BUG,
  GITHUB_REPO,
} from "@/lib/githubLinks";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LINKS = [
  {
    href: GITHUB_REPORT_BUG,
    label: "Report a bug",
    icon: Bug,
  },
  {
    href: GITHUB_ASK_QUESTION,
    label: "Ask a question",
    icon: MessageCircle,
  },
  {
    href: GITHUB_FEATURE_REQUEST,
    label: "Suggest a feature",
    icon: Lightbulb,
  },
  {
    href: GITHUB_REPO,
    label: "View on GitHub",
    icon: Github,
  },
] as const;

function ExternalLink({
  href,
  label,
  icon: Icon,
  className,
}: {
  href: string;
  label: string;
  icon: typeof Bug;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs transition-colors",
        "text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-accent)] hover:text-white",
        className
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{label}</span>
    </a>
  );
}

export function SidebarFeedback({ expanded }: { expanded: boolean }) {
  if (expanded) {
    return (
      <div className="shrink-0 px-2 py-3">
        <p className="mb-2 px-2.5 text-[10px] font-medium text-[var(--sidebar-muted)]">
          Help & feedback
        </p>
        <nav className="flex flex-col ">
          {LINKS.map((link) => (
            <ExternalLink key={link.href} {...link} />
          ))}
        </nav>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 justify-center border-t border-[var(--sidebar-border)] px-2 py-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--sidebar-muted)] transition-colors hover:bg-[var(--sidebar-accent)] hover:text-white"
            aria-label="Help and feedback"
            title="Help & feedback"
          >
            <CircleHelp className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="right"
          align="end"
          sideOffset={8}
          className="w-52"
        >
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Help & feedback
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <DropdownMenuItem key={link.href} asChild>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex cursor-pointer items-center gap-2"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {link.label}
                </a>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
