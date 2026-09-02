"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { JOURNEY_STEPS, isPathActive, type JourneyStep } from "@/lib/journey";
import type { LucideIcon } from "lucide-react";
import { Home, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { SidebarFeedback } from "@/components/SidebarFeedback";

const STORAGE_KEY = "concierge.sidebar.expanded";

export function Sidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === "1") setExpanded(true);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const toggle = () => {
    setExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <aside
      className={cn(
        "group/sidebar flex h-full shrink-0 flex-col bg-[var(--sidebar-background)] text-[var(--sidebar-foreground)] transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        expanded ? "w-[15.5rem]" : "w-[4.25rem]",
        !hydrated && "w-[4.25rem]"
      )}
    >
      <div
        className={cn(
          "flex h-20 items-center gap-2 px-3",
          expanded ? "justify-between" : "justify-center"
        )}
      >
        <Link
          href="/"
          className={cn(
            "flex items-center overflow-hidden ",
            !expanded && "justify-center"
          )}
          title="Concierge"
        >
          <span
            className={cn(
              "whitespace-nowrap text-2xl  transition-opacity duration-200 ml-3",
              expanded ? "opacity-100" : "w-0 opacity-0"
            )}
          >
            Concierge
          </span>
        </Link>
        {expanded ? (
          <button
            type="button"
            onClick={toggle}
            className="rounded-lg p-1.5 text-[var(--sidebar-muted)] transition-colors hover:bg-[var(--sidebar-accent)] hover:text-white"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      {!expanded ? (
        <button
          type="button"
          onClick={toggle}
          className="mx-auto mb-2 rounded-lg p-2 text-[var(--sidebar-muted)] transition-colors hover:bg-[var(--sidebar-accent)] hover:text-white"
          aria-label="Expand sidebar"
        >
          <PanelLeftOpen className="h-5 w-5" />
        </button>
      ) : null}

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 pb-4">
        <NavRow
          href="/dashboard"
          icon={Home}
          title="Home"
          explainer="Command desk"
          active={pathname === "/dashboard"}
          expanded={expanded}
        />

        {expanded ? (
          <p className="mb-1 mt-4 px-2.5 text-[10px] font-medium     text-[var(--sidebar-muted)]">
            Workspace
          </p>
        ) : (
          <div className="my-2 mx-auto h-px w-6 bg-[var(--sidebar-border)]" />
        )}

        {JOURNEY_STEPS.map((step) => (
          <JourneyStepBlock
            key={step.id}
            step={step}
            pathname={pathname}
            expanded={expanded}
          />
        ))}
      </nav>

      <SidebarFeedback expanded={expanded} />
    </aside>
  );
}

function JourneyStepBlock({
  step,
  pathname,
  expanded,
}: {
  step: JourneyStep;
  pathname: string;
  expanded: boolean;
}) {
  const subActive = step.subSteps?.some((s) => isPathActive(pathname, s.href));
  const isStepActive =
    (step.href && isPathActive(pathname, step.href)) || !!subActive;
  const isSoon = step.status === "coming-soon";

  return (
    <div>
      {step.href ? (
        <NavRow
          href={step.href}
          icon={step.icon}
          title={step.shortTitle}
          explainer={step.tagline}
          active={isStepActive}
          soon={isSoon}
          expanded={expanded}
        />
      ) : (
        <NavRow
          icon={step.icon}
          title={step.shortTitle}
          explainer={step.tagline}
          disabled
          soon
          expanded={expanded}
        />
      )}

      {expanded && step.subSteps && step.subSteps.length > 0 && (
        <ul className="mb-1 ml-6 mt-0.5 space-y-0.5 border-l border-[var(--sidebar-border)] pl-2.5">
          {step.subSteps.map((sub) => {
            const live = sub.href !== "#";
            const active = isPathActive(pathname, sub.href);
            if (!live) {
              return (
                <li
                  key={sub.id}
                  className="px-2 py-1 text-xs text-[var(--sidebar-muted)]/50"
                >
                  {sub.name}
                </li>
              );
            }
            return (
              <li key={sub.id}>
                <Link
                  href={sub.href}
                  className={cn(
                    "block rounded-lg px-2 py-1 text-xs transition-colors",
                    active
                      ? " text-white"
                      : "text-[var(--sidebar-muted)] hover:text-white"
                  )}
                >
                  {sub.name}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function NavRow({
  href,
  icon: Icon,
  title,
  explainer,
  active = false,
  disabled = false,
  soon = false,
  expanded,
}: {
  href?: string;
  icon: LucideIcon;
  title: string;
  explainer?: string;
  active?: boolean;
  disabled?: boolean;
  soon?: boolean;
  expanded: boolean;
}) {
  const className = cn(
    "flex items-center rounded-full transition-colors",
    expanded ? "gap-2.5 px-4 py-3" : "mx-auto h-10 w-10 justify-center",
    active && " text-brand",
    !active &&
      !disabled &&
      "text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-accent)] hover:text-white",
    disabled && "cursor-default opacity-40"
  );

  const body = (
    <>
      <Icon className="h-5 w-5 shrink-0"  />
      {expanded ? (
        <span className="min-w-0 flex-1 overflow-hidden">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-medium">{title}</span>
            {soon && (
              <span className="text-[9px]     text-[var(--sidebar-muted)]">
                Soon
              </span>
            )}
          </span>
          {explainer ? (
            <span className="mt-0.5  truncate text-[10px] leading-snug text-[var(--sidebar-muted)] hidden">
              {explainer}
            </span>
          ) : null}
        </span>
      ) : null}
    </>
  );

  if (disabled || !href) {
    return (
      <div className={className} title={title}>
        {body}
      </div>
    );
  }
  return (
    <Link href={href} className={className} title={explainer ? `${title} — ${explainer}` : title}>
      {body}
    </Link>
  );
}
