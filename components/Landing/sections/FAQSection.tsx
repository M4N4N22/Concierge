import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

const FAQS = [
  {
    q: "What does Concierge actually do?",
    a: "It’s your vault-backed AI identity on 0G: store files on Storage, fund Compute so Concierge can read them, mint one Agentic ID, then chat — or list, rent, or transfer that ID.",
  },
  {
    q: "How is this different from ChatGPT?",
    a: "ChatGPT doesn’t know your wallet or files. Concierge answers from agent knowledge in your vault — structured packs or Insights summaries — using 0G Compute you fund yourself.",
  },
  {
    q: "I uploaded files — why can’t I chat?",
    a: "Uploads are stored first (like Drive). Chat needs agent knowledge: Quick add structured data, or run Insights after funding compute. The Chat page checklist shows what’s missing.",
  },
  {
    q: "What is an Agentic ID?",
    a: "One on-chain Concierge identity per wallet, bound to your vault. It’s ownership and rentable access — not a separate “smarter” model by itself.",
  },
  {
    q: "Are finance / travel / subscription separate agents?",
    a: "No. Those are chat focus chips — ways to bias answers over matching vault files on the same Concierge personality.",
  },
  {
    q: "Does trading happen automatically?",
    a: "No. The trading desk is optional. Agents can suggest Buy, Sell, or Hold; you confirm. Core product is vault → knowledge → chat → Agentic ID.",
  },
  {
    q: "What does it cost?",
    a: "You pay 0G network fees: gas, storage, and Compute. There’s no Concierge subscription.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="scroll-mt-24 px-6 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div>
            <p className="text-[11px] font-semibold   text-[var(--brand)]">
              FAQ
            </p>
            <h2 className="mt-3 text-3xl font-semibold   sm:text-5xl">
              Common questions
            </h2>
            <Button asChild className="mt-8 rounded-full">
              <Link href="/dashboard">Open Concierge</Link>
            </Button>
          </div>

          <Accordion type="single" collapsible className="space-y-2">
            {FAQS.map((faq, i) => (
              <AccordionItem
                key={faq.q}
                value={`faq-${i}`}
                className="rounded-[var(--radius)] border-0 bg-[var(--surface)] px-1"
              >
                <AccordionTrigger className="px-5 py-4 text-left text-sm font-semibold hover:no-underline sm:text-base">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
