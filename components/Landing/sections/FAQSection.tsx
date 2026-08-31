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
    q: "How is this different from ChatGPT?",
    a: "ChatGPT doesn’t know your wallet or files. Concierge answers from what you save in your vault on 0G Storage, using 0G Compute you fund yourself.",
  },
  {
    q: "What is an Agentic ID?",
    a: "Your on-chain AI agent identity (formerly called an INFT). Mint one per wallet, link it to your vault, then list, rent, or transfer it.",
  },
  {
    q: "Where is my data stored?",
    a: "In your vault on 0G Storage — wallet history, spreadsheets, notes. Concierge doesn’t keep a copy on our servers.",
  },
  {
    q: "Does trading happen automatically?",
    a: "No. Agents suggest Buy, Sell, or Hold. You choose the size, review the OG/USDC quote, and confirm in your wallet.",
  },
  {
    q: "What does it cost?",
    a: "You pay 0G network fees: gas, storage, and Compute. There’s no Concierge subscription.",
  },
  {
    q: "Can I take my agent elsewhere?",
    a: "Yes. Your vault files and Agentic ID live on-chain. Export anytime — disconnecting the app doesn’t delete them.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="scroll-mt-24 px-6 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
              FAQ
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
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
