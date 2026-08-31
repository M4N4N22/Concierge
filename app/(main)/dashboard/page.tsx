"use client";

import Link from "next/link";
import { JOURNEY_STEPS } from "@/lib/journey";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { Hint } from "@/components/ui/hint";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-medium tracking-tight">Workspace</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Vault → Board → Agentic ID → Ecosystem
        </p>
      </div>

      <div className="space-y-1">
        {JOURNEY_STEPS.map((step) => {
          const Icon = step.icon;
          const live = step.status === "live" && step.href;
          return (
            <Panel
              key={step.id}
              className={cn(
                "flex items-center gap-3 !py-3",
                !live && "opacity-50"
              )}
              pad
            >
              <span className="font-mono text-[11px] text-muted-foreground tabular-nums w-5">
                {String(step.step).padStart(2, "0")}
              </span>
              <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium">{step.shortTitle}</span>
                  <Hint text={step.description} />
                </div>
              </div>
              {live && step.href ? (
                <Button asChild size="sm" variant="ghost">
                  <Link href={step.href}>
                    Open
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              ) : null}
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
