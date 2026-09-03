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
    a: "It’s a personal AI on 0G that knows your vault: store files, turn them into knowledge, chat, mint one Agentic ID you own — then list, rent, or (soon) lend access without sharing private uploads.",
  },
  {
    q: "How is this different from ChatGPT?",
    a: "ChatGPT doesn’t hold your files as an asset you own. Concierge answers from your vault on 0G, and the Concierge identity can move with you.",
  },
  {
    q: "I uploaded files — why can’t I chat?",
    a: "Uploads are stored first. Chat needs knowledge: Quick add, or run Knowledge after funding compute. The Chat page checklist shows what’s missing.",
  },
  {
    q: "What is an Agentic ID?",
    a: "One on-chain Concierge identity per wallet, tied to your vault. It’s how you own, rent, or transfer the Concierge.",
  },
  {
    q: "What is lend access?",
    a: "Coming later: let someone use your Concierge for a set time without browsing your private files. Today’s Ecosystem rentals are the live path.",
  },
  {
    q: "Does trading happen automatically?",
    a: "No. Trading is optional and needs your confirmation. The core loop is vault → knowledge → chat → Agentic ID.",
  },
  {
    q: "What does it cost?",
    a: "You pay 0G network fees: gas, storage, and Compute. There’s no Concierge subscription.",
  },
] as const;

export function FAQSection() {
  return (
    <section id="faq" className="scroll-mt-24 px-6 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <div>
            <p className="landing-pill">FAQ</p>
            <h2 className="font-display mt-5 text-3xl font-semibold tracking-tight sm:text-5xl">
              Common questions
            </h2>
            <Button
              asChild
              className="mt-8 rounded-full bg-[var(--landing-ink)] px-6 text-white hover:bg-[var(--landing-ink)]/90"
            >
              <Link href="/dashboard">Open Concierge</Link>
            </Button>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {FAQS.map((faq, i) => (
              <AccordionItem
                key={faq.q}
                value={`faq-${i}`}
                className="landing-card border-0 px-1"
              >
                <AccordionTrigger className="px-5 py-4 text-left text-sm font-semibold hover:no-underline sm:text-base">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5 text-sm leading-relaxed text-[var(--landing-muted)]">
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
