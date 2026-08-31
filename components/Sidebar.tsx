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
    <aside className="flex h-full w-56 shrink-0 flex-col bg-[var(--sidebar-background)] hairline border-r">
      <div className="px-4 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-[11px] font-semibold text-primary-foreground">
            C
          </span>
          <span className="text-sm font-medium tracking-tight text-[var(--sidebar-foreground)]">
            Concierge
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        <NavRow
          href="/dashboard"
          icon={Home}
          title="Overview"
          active={pathname === "/dashboard"}
        />

        <p className="mb-1 mt-5 px-2.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Workspace
        </p>

        <div className="space-y-0.5">
          {JOURNEY_STEPS.map((step) => (
            <JourneyStepBlock key={step.id} step={step} pathname={pathname} />
          ))}
        </div>
      </nav>
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
          active={isStepActive}
          soon={isSoon}
        />
      ) : (
        <NavRow icon={step.icon} title={step.shortTitle} disabled soon />
      )}

      {step.subSteps && step.subSteps.length > 0 && isStepActive && (
        <ul className="mb-1 ml-3 mt-0.5 space-y-0.5 border-l hairline pl-2.5">
          {step.subSteps.map((sub) => {
            const live = sub.href !== "#";
            const active = isPathActive(pathname, sub.href);
            if (!live) {
              return (
                <li
                  key={sub.id}
                  className="px-2 py-1 text-xs text-muted-foreground/50"
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
                    "block rounded-md px-2 py-1 text-xs transition-colors",
                    active
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
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
  active = false,
  disabled = false,
  soon = false,
}: {
  href?: string;
  icon: LucideIcon;
  title: string;
  active?: boolean;
  disabled?: boolean;
  soon?: boolean;
}) {
  const className = cn(
    "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
    active && "bg-muted text-foreground",
    !active && !disabled && "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
    disabled && "cursor-default opacity-40"
  );

  const body = (
    <>
      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
      <span className="min-w-0 flex-1 truncate font-medium">{title}</span>
      {soon && (
        <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
          Soon
        </span>
      )}
    </>
  );

  if (disabled || !href) return <div className={className}>{body}</div>;
  return (
    <Link href={href} className={className}>
      {body}
    </Link>
  );
}
