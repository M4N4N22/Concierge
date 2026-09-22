"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  companySortIndex,
  type ChatApiFormat,
  type ComputeModelOption,
} from "@/lib/computeModels";
import { cn } from "@/lib/utils";

type FormatFilter = "all" | ChatApiFormat;

type ChatModelPickerProps = {
  models: ComputeModelOption[];
  selectedModel: string;
  onModelChange: (model: string) => void;
};

export function ChatModelPicker({
  models,
  selectedModel,
  onModelChange,
}: ChatModelPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [formatFilter, setFormatFilter] = useState<FormatFilter>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");

  const selected = models.find((m) => m.id === selectedModel);

  const companies = useMemo(() => {
    const set = new Set(models.map((m) => m.company));
    return [...set].sort((a, b) => companySortIndex(a) - companySortIndex(b));
  }, [models]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = models.filter((m) => {
      if (formatFilter !== "all" && !m.formats.includes(formatFilter)) {
        return false;
      }
      if (companyFilter !== "all" && m.company !== companyFilter) {
        return false;
      }
      if (!q) return true;
      return (
        m.label.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.company.toLowerCase().includes(q)
      );
    });

    const byCompany = new Map<string, ComputeModelOption[]>();
    for (const m of filtered) {
      const list = byCompany.get(m.company) ?? [];
      list.push(m);
      byCompany.set(m.company, list);
    }

    return [...byCompany.entries()].sort(
      ([a], [b]) => companySortIndex(a) - companySortIndex(b)
    );
  }, [models, query, formatFilter, companyFilter]);

  const totalVisible = groups.reduce((n, [, list]) => n + list.length, 0);

  const close = () => {
    setOpen(false);
    setQuery("");
    setFormatFilter("all");
    setCompanyFilter("all");
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
        setFormatFilter("all");
        setCompanyFilter("all");
      }
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 max-w-[14rem] justify-between gap-1.5 rounded-full border-border/60 bg-muted/30 px-3 text-[11px] font-medium"
        onClick={() => setOpen(true)}
      >
        <span className="truncate">
          {selected?.label ?? selectedModel ?? "Model"}
        </span>
        <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50" />
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/55"
            aria-label="Close model picker"
            onClick={close}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="chat-model-picker-title"
            className="relative z-10 flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-border/60 bg-background shadow-2xl sm:max-h-[80vh] sm:rounded-3xl"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border/50 px-5 py-4">
              <div className="min-w-0">
                <h2
                  id="chat-model-picker-title"
                  className="text-base font-semibold tracking-tight"
                >
                  Choose model
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {totalVisible} available
                  {selected ? ` · current ${selected.label}` : ""}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="shrink-0"
                onClick={close}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="shrink-0 space-y-3 border-b border-border/50 px-5 py-3">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or id…"
                  className="h-10 bg-muted/40 pl-9 text-sm"
                  autoFocus
                />
              </div>

             

              <div className="-mx-1 flex gap-1.5 overflow-x-auto p-1 pb-0.5">
                <button
                  type="button"
                  onClick={() => setCompanyFilter("all")}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    companyFilter === "all"
                      ? "bg-[var(--brand)]/15 text-foreground ring-1 ring-[var(--brand)]/40"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted"
                  )}
                >
                  All companies
                </button>
                {companies.map((company) => (
                  <button
                    key={company}
                    type="button"
                    onClick={() => setCompanyFilter(company)}
                    className={cn(
                      "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                      companyFilter === company
                        ? "bg-[var(--brand)]/15 text-foreground ring-1 ring-[var(--brand)]/40"
                        : "bg-muted/40 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {company}
                  </button>
                ))}
              </div>
            </div>

            <div className="brand-scroll min-h-0 flex-1 overflow-y-auto px-3 pb-4 sm:px-4">
              {totalVisible === 0 ? (
                <p className="px-3 py-12 text-center text-sm text-muted-foreground">
                  No models match
                </p>
              ) : (
                <div className="space-y-5">
                  {groups.map(([company, list]) => (
                    <section key={company}>
                      <div className="sticky top-0 z-10 my-2 flex items-center justify-between bg-background/95 px-2 py-1.5 backdrop-blur-sm">
                        <h3 className="text-xs font-semibold text-muted-foreground ">
                          {company}
                        </h3>
                        <span className="text-xs tabular-nums text-muted-foreground/70">
                          {list.length}
                        </span>
                      </div>
                      <ul className="space-y-1">
                        {list.map((m) => {
                          const active = m.id === selectedModel;
                          return (
                            <li key={m.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  onModelChange(m.id);
                                  close();
                                }}
                                className={cn(
                                  "flex w-full items-center gap-3 rounded-xl px- py-2.5 text-left transition-colors",
                                  active
                                    ? "bg-accent text-accent-foreground"
                                    : "hover:bg-muted/60"
                                )}
                              >
                                <Check
                                  className={cn(
                                    "h-4 w-4 shrink-0",
                                    active ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-medium">
                                    {m.label}
                                  </span>
                                  {m.description ? (
                                    <span className="mt-0.5 block text-xs text-muted-foreground">
                                      {m.description}
                                    </span>
                                  ) : null}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
