"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getNextStep,
  getPrevStep,
  type JourneyStepId,
} from "@/lib/journey";

interface JourneyStepHeaderProps {
  step: number;
  title: string;
  tagline: string;
  description: string;
  journeyId: JourneyStepId;
  badge?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function JourneyStepHeader({
  step,
  title,
  tagline,
  description,
  journeyId,
  badge,
  actions,
  className,
}: JourneyStepHeaderProps) {
  const prev = getPrevStep(journeyId);
  const next = getNextStep(journeyId);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary/15 text-primary text-sm font-semibold">
              {step}
            </span>
            <p className="text-sm font-medium text-primary uppercase tracking-wide">
              Step {step} · {tagline}
            </p>
            {badge && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {badge}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground leading-relaxed">{description}</p>
        </div>
        {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border/60">
        {prev?.href ? (
          <Button variant="ghost" size="sm" asChild>
            <Link href={prev.href} className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              {prev.shortTitle}
            </Link>
          </Button>
        ) : (
          <span />
        )}
        {next?.href ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={next.href} className="gap-1">
              Next: {next.shortTitle}
              {next.status === "coming-soon" && (
                <span className="text-[10px] text-muted-foreground">(preview)</span>
              )}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : next ? (
          <Button variant="outline" size="sm" disabled className="gap-1 opacity-60">
            Next: {next.shortTitle}
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
