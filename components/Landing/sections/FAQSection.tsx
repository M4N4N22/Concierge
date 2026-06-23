import { 
    Accordion, 
    AccordionContent, 
    AccordionItem, 
    AccordionTrigger 
  } from "@/components/ui/accordion";
  import Link from "next/link";
  
  export const FAQSection = () => {
    const faqs = [
      {
        question: "How is this different from ChatGPT?",
        answer: "ChatGPT gives generic advice because it doesn't know your personal data. Concierge learns exclusively from YOUR vault files, giving truly personalized insights. For example, ChatGPT can't tell you if you should switch phone plans because it doesn't know your usage patterns — but Concierge can analyze your actual bills and usage data to give specific recommendations."
      },
      {
        question: "Is my data really secure?",
        answer: "Yes. Your data is encrypted and stored on 0G's decentralized network. Only you control access via your wallet. Compute runs on 0G with verifiable inference, and file metadata is registered on-chain. Unlike Big Tech platforms that profit from your data, Concierge is built so you maintain ownership and control."
      },
      {
        question: "What's an Agentic ID?",
        answer: "Your Agentic ID is an onchain personal agent — an ERC-721 token bound to your vault on 0G Chain. Unlike generic AI assistants, it fingerprints your data-backed intelligence, evolves as you add files and run compute, and can eventually be traded, delegated, or rented in the agent ecosystem."
      },
      {
        question: "Can I trust this with sensitive financial data?",
        answer: "Concierge is designed for sensitive personal data: encrypted 0G Storage, wallet-gated access, and onchain registry for verifiability. Your files stay in your vault — compute reads them only when you fund and run inference. Always review what you upload and use testnet first if you're experimenting."
      },
      {
        question: "How much does it cost?",
        answer: "Uploading and vault registration use 0G testnet/mainnet gas and storage. 0G Compute requires funding a ledger (3 OG minimum to create, 1 OG minimum per provider) before running inference. There is no separate Concierge subscription — you pay the underlying 0G network costs."
      },
      {
        question: "What if I want to leave?",
        answer: "Your data, your choice. Export everything anytime in standard formats. Your Agentic ID and vault registry are on-chain — you're never locked into a proprietary silo. Disconnect your wallet and your access ends; your onchain assets remain yours."
      },
      {
        question: "How does the AI learn from my data without violating privacy?",
        answer: "Inference runs on 0G Compute against files in your vault — not a shared model trained on everyone else's data. Categories and summaries are written back to your onchain registry. Chat (coming soon) will answer only from your documents, never generic web knowledge."
      },
      {
        question: "What types of data can I upload?",
        answer: "Documents, spreadsheets, receipts, exports, and other personal files. The more relevant data you add, the more useful insights and domain agents become. Everything is encrypted on 0G Storage and registered to your wallet-owned vault."
      }
    ];
  
    return (
      <section className="pitch-section  p-36">
        <div className="section-container">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-medium mb-6">
              <span className="text-gradient">Frequently Asked</span> Questions
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Everything you need to know about Concierge, your data security, and wallet-owned Agentic IDs.
            </p>
          </div>
  
          <div className="max-w-4xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index}
                  value={`item-${index}`}
                  className="bg-card rounded-2xl shadow-card border-0 overflow-hidden"
                >
                  <AccordionTrigger className="px-6 py-5 text-left font-semibold  hover:no-underline  transition-colors">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-5 text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
  
          {/* Additional Support */}
          <div className="mt-16 text-center">
            <div className=" rounded-2xl p-8 max-w-2xl mx-auto">
              <h3 className="text-xl font-semibold mb-3 text-vault-dark">
                Still have questions?
              </h3>
              <p className="text-muted-foreground mb-4">
                Join our Discord community or email us directly. We&apos;re building this platform with our users, 
                and your feedback shapes our roadmap.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link 
                  href="/dashboard/vault/my-files"
                  className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Launch App
                </Link>
                <a 
                  href="https://x.com/mananbuilds/status/1985758895386800449"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-3 border border-primary text-primary rounded-lg font-medium hover:bg-primary/5 transition-colors"
                >
                  How It Works
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  };