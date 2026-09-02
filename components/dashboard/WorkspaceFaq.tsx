"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export type FaqItem = {
  q: string;
  a: string;
};

export function WorkspaceFaq({
  items,
  title = "FAQ",
  subtitle = "Quick answers about this surface.",
}: {
  items: FaqItem[];
  title?: string;
  subtitle?: string;
}) {
  return (
    <section className="bento p-5 sm:p-6">
      <p className="text-[11px] font-semibold     text-[var(--brand)]">
        {title}
      </p>
      <h2 className="mt-1 text-sm font-semibold  ">
        Common questions
      </h2>
      {subtitle ? (
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      ) : null}
      <Accordion type="single" collapsible className="mt-4 space-y-1.5">
        {items.map((faq, i) => (
          <AccordionItem
            key={faq.q}
            value={`faq-${i}`}
            className="rounded-[var(--radius)] border-0 bg-muted/35 px-1"
          >
            <AccordionTrigger className="px-4 py-3.5 text-left text-sm font-semibold hover:no-underline">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
