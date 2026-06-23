"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { JOURNEY_STEPS, isPathActive, type JourneyStep } from "@/lib/journey";
import type { LucideIcon } from "lucide-react";
import { Home } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar-background)]">
      <div className="border-b border-[var(--sidebar-border)] px-5 py-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-sm font-bold text-primary-foreground shadow-sm">
            C
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold leading-tight tracking-tight text-[var(--sidebar-foreground)]">
              Concierge
            </p>
            <p className="text-[11px] text-muted-foreground">Personal Agentic ID</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
          Start here
        </p>
        <NavRow
          href="/dashboard"
          icon={Home}
          title="Overview"
          tagline="Your journey at a glance"
          active={pathname === "/dashboard"}
        />

        <p className="mb-2 mt-5 px-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
          Your journey
        </p>

        <div className="space-y-1">
          {JOURNEY_STEPS.map((step) => (
            <JourneyStepBlock key={step.id} step={step} pathname={pathname} />
          ))}
        </div>
      </nav>

      <div className="border-t border-[var(--sidebar-border)] px-5 py-4">
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Built on{" "}
          <span className="font-medium text-primary/90">0G Storage</span>,{" "}
          <span className="font-medium text-primary/90">Compute</span> &{" "}
          <span className="font-medium text-primary/90">Chain</span>
        </p>
      </div>
    </aside>
  );
}

function JourneyStepBlock({
  step,
  pathname,
}: {
  step: JourneyStep;
  pathname: string;
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
          tagline={step.tagline}
          active={isStepActive}
          soon={isSoon}
        />
      ) : (
        <NavRow
          icon={step.icon}
          title={step.shortTitle}
          tagline={step.tagline}
          disabled
          soon
        />
      )}

      {step.subSteps && step.subSteps.length > 0 && (
        <ul className="mb-2 ml-[2.65rem] mt-1 space-y-0.5 border-l border-[var(--sidebar-border)] pl-3">
          {step.subSteps.map((sub) => {
            const live = sub.href !== "#";
            const active = isPathActive(pathname, sub.href);

            return (
              <li key={sub.id}>
                {live ? (
                  <Link
                    href={sub.href}
                    className={cn(
                      "group block rounded-md px-2 py-1.5 transition-colors",
                      active
                        ? "bg-primary/[0.07] text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "block text-[13px] leading-tight",
                        active && "font-medium"
                      )}
                    >
                      {sub.name}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground/80 group-hover:text-muted-foreground">
                      {sub.description}
                    </span>
                  </Link>
                ) : (
                  <div className="px-2 py-1.5 opacity-45">
                    <span className="block text-[13px] leading-tight text-muted-foreground">
                      {sub.name}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground/70">
                      {sub.description}
                    </span>
                  </div>
                )}
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
  tagline,
  active = false,
  disabled = false,
  soon = false,
}: {
  href?: string;
  icon: LucideIcon;
  title: string;
  tagline: string;
  active?: boolean;
  disabled?: boolean;
  soon?: boolean;
}) {
  const className = cn(
    "group relative flex gap-3 rounded-xl px-2.5 py-2.5 transition-colors",
    active &&
      "bg-primary/[0.06] before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:rounded-full before:bg-primary",
    !active &&
      !disabled &&
      "hover:bg-black/[0.03] dark:hover:bg-white/[0.04]",
    disabled && "cursor-default opacity-60"
  );

  const iconWrap = cn(
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
    active
      ? "bg-primary/15 text-primary"
      : "bg-muted/50 text-muted-foreground group-hover:bg-muted/70 group-hover:text-foreground",
    disabled && "bg-muted/30 text-muted-foreground/50"
  );

  const body = (
    <>
      <span className={iconWrap}>
        <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.25 : 2} />
      </span>
      <span className="min-w-0 flex-1 pt-0.5">
        <span className="flex items-center gap-1.5">
          <span
            className={cn(
              "truncate text-[13px] font-medium leading-tight",
              active ? "text-foreground" : "text-foreground/85",
              disabled && "text-muted-foreground"
            )}
          >
            {title}
          </span>
          {soon && (
            <span className="shrink-0 rounded px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide bg-muted text-muted-foreground">
              Soon
            </span>
          )}
        </span>
        <span className="mt-0.5 block truncate text-[11px] leading-snug text-muted-foreground">
          {tagline}
        </span>
      </span>
    </>
  );

  if (disabled || !href) {
    return <div className={className}>{body}</div>;
  }

  return (
    <Link href={href} className={className}>
      {body}
    </Link>
  );
}
