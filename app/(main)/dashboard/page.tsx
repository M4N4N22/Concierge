"use client";

import Link from "next/link";
import { JOURNEY_STEPS } from "@/lib/journey";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Your personal intelligence journey
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Upload private data → AI organizes it → chat with your vault → mint an
          Agentic ID → train, trade, or rent agents on 0G.
        </p>
      </div>

      <div className="relative">
        {JOURNEY_STEPS.map((step, index) => {
          const Icon = step.icon;
          const isLive = step.status === "live" && step.href;
          const isLast = index === JOURNEY_STEPS.length - 1;

          return (
            <div key={step.id} className="relative flex gap-4 pb-8">
              {!isLast && (
                <div
                  className="absolute left-[18px] top-10 bottom-0 w-px bg-border"
                  aria-hidden
                />
              )}

              <div
                className={cn(
                  "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold",
                  isLive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted bg-muted/30 text-muted-foreground"
                )}
              >
                {step.step}
              </div>

              <Card
                className={cn(
                  "flex-1 transition-shadow",
                  isLive && "hover:shadow-md hover:border-primary/30"
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{step.title}</CardTitle>
                    </div>
                    {step.status === "coming-soon" && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                        <Lock className="h-3 w-3" />
                        Coming soon
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-primary font-medium">{step.tagline}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{step.description}</p>

                  {step.subSteps && (
                    <ul className="text-xs text-muted-foreground space-y-1 pl-1">
                      {step.subSteps.map((sub) => (
                        <li key={sub.id} className="flex items-center gap-2">
                          <span className="h-1 w-1 rounded-full bg-primary" />
                          {sub.name}
                          {sub.href === "#" && (
                            <span className="text-muted-foreground/60">(soon)</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  {isLive && step.href && (
                    <Button asChild size="sm">
                      <Link href={step.href} className="gap-1">
                        Start step {step.step}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">New here?</strong> Start with{" "}
            <Link
              href="/dashboard/vault/my-files"
              className="text-primary font-medium hover:underline"
            >
              Step 1: Upload
            </Link>
            , then run{" "}
            <Link
              href="/dashboard/vault/insights"
              className="text-primary font-medium hover:underline"
            >
              Step 2: Insights
            </Link>{" "}
            before minting your Agentic ID.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
