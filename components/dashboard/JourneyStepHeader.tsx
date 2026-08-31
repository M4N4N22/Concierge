"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/ui/hint";
import { cn } from "@/lib/utils";
import {
  getNextStep,
  getPrevStep,
  type JourneyStepId,
} from "@/lib/journey";

interface JourneyStepHeaderProps {
  step: number;
  title: string;
  tagline?: string;
  description?: string;
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
    <div className={cn("space-y-3", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono tabular-nums">{String(step).padStart(2, "0")}</span>
            {tagline ? <span>· {tagline}</span> : null}
            {badge ? (
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                {badge}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-medium tracking-tight text-foreground">
              {title}
            </h1>
            {description ? <Hint text={description} /> : null}
          </div>
        </div>
        {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
      </div>

      <div className="flex items-center justify-between pt-2 hairline border-t">
        {prev?.href ? (
          <Button variant="ghost" size="sm" asChild>
            <Link href={prev.href} className="gap-1 text-muted-foreground">
              <ArrowLeft className="h-3.5 w-3.5" />
              {prev.shortTitle}
            </Link>
          </Button>
        ) : (
          <span />
        )}
        {next?.href ? (
          <Button variant="ghost" size="sm" asChild>
            <Link href={next.href} className="gap-1">
              {next.shortTitle}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
