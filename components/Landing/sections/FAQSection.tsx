import { 
    Accordion, 
    AccordionContent, 
    AccordionItem, 
    AccordionTrigger 
  } from "@/components/ui/accordion";
  
  export const FAQSection = () => {
    const faqs = [
      {
        question: "How is this different from ChatGPT?",
        answer: "ChatGPT gives generic advice because it doesn't know your personal data. VaultMind's AI learns exclusively from YOUR files, giving truly personalized insights. For example, ChatGPT can't tell you if you should switch phone plans because it doesn't know your usage patterns, but VaultMind can analyze your actual bills and usage data to give specific recommendations."
      },
      {
        question: "Is my data really secure?",
        answer: "Yes. Your data is encrypted and stored on 0G's decentralized network. Only you have the keys. We use zero-knowledge proofs so AI can learn without seeing raw data. Unlike Big Tech companies that profit from your data, we're built on blockchain technology where you maintain complete ownership and control."
      },
      {
        question: "What's an INFT agent?",
        answer: "It's an AI assistant you actually own as an NFT. Unlike ChatGPT, your agent is unique to you, evolves with your data, and can be traded or upgraded. Think of it as your personal AI that gets smarter over time and becomes a valuable digital asset you control."
      },
      {
        question: "Can I trust this with sensitive financial data?",
        answer: "Absolutely. Built on enterprise-grade blockchain security with the same encryption standards used by banks. Your data never leaves your control, and all AI operations are verifiable on-chain. We're SOC2 compliant and use military-grade encryption protocols."
      },
      {
        question: "How much does it cost?",
        answer: "Free tier includes 5GB storage and basic AI features. Premium features start at $19.99/month, which is much cheaper than the money you'll save from better financial decisions. Early adopters get significant discounts and bonus features."
      },
      {
        question: "What if I want to leave?",
        answer: "Your data, your choice. Export everything anytime in standard formats. That's the beauty of true ownership - you're never locked in. Your INFT agent and all your data can be moved or deleted at your discretion."
      },
      {
        question: "How does the AI learn from my data without violating privacy?",
        answer: "We use advanced cryptographic techniques called zero-knowledge proofs. Your AI can learn patterns and insights from your data without the raw data ever being exposed. It's like having a personal analyst who can see trends but never sees your actual private information."
      },
      {
        question: "What types of data can I upload?",
        answer: "Documents, spreadsheets, photos, emails, financial records, health data, calendar events, browser history, social media exports, and more. The more data you provide, the more personalized and valuable your AI agent becomes. All data is encrypted and never shared."
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
              Everything you need to know about VaultMind, your data security, and how personal AI ownership works.
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
                <a 
                  href="mailto:hello@vaultmind.ai" 
                  className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Email Support
                </a>
                <a 
                  href="#" 
                  className="inline-flex items-center justify-center px-6 py-3 border border-primary text-primary rounded-lg font-medium hover:bg-primary/5 transition-colors"
                >
                  Join Discord
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  };