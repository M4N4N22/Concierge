import { cn } from "@/lib/utils";
import { Hint } from "@/components/ui/hint";

/** Flat surface — solid fill, no decorative border or shadow. */
export function Panel({
  className,
  children,
  pad = true,
}: {
  className?: string;
  children: React.ReactNode;
  pad?: boolean;
}) {
  return (
    <div className={cn("panel", pad && "panel-pad", className)}>{children}</div>
  );
}

export function PanelHeader({
  title,
  hint,
  action,
  className,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-center justify-between gap-3", className)}>
      <div className="flex items-center gap-1.5 min-w-0">
        <h2 className="truncate text-sm font-medium tracking-tight text-foreground">
          {title}
        </h2>
        {hint ? <Hint text={hint} /> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
