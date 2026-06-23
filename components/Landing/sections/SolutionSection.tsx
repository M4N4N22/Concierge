import { Shield, Brain, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const SolutionSection = () => {
  const steps = [
    {
      icon: Shield,
      title: "Secure Vault",
      description: "Upload your personal files to encrypted 0G Storage",
      details:
        "Documents are encrypted, registered on-chain, and stay under your wallet — not a Big Tech silo.",
    },
    {
      icon: Lightbulb,
      title: "Smart Insights",
      description: "0G Compute organizes and summarizes your vault",
      details:
        "Fund a compute ledger, run inference on your files, and get categories and summaries written back on-chain.",
    },
    {
      icon: Brain,
      title: "Agentic ID",
      description: "Mint your onchain personal agent on 0G Chain",
      details:
        "Your Agentic ID fingerprints your data-backed intelligence — the gateway to domain learning, chat, and the agent ecosystem.",
    },
  ];

  return (
    <section className="pitch-section p-36 bg-card/30">
      <div className="section-container">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-medium mb-6">
            <span className="text-primary">Concierge:</span> Your Data, Your AI, Your Control
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Concierge is a personal intelligence platform on 0G: upload private data,
            run verifiable compute, mint a wallet-owned Agentic ID, and build toward
            a marketplace of data-backed agents.
          </p>
        </div>

        {/* Solution Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {steps.map((step, index) => (
            <div 
              key={index}
              className="relative"
            >
              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-primary to-accent -translate-x-8" />
              )}
              
              <div className="bg-card rounded-3xl p-8 shadow-card hover-lift relative z-10">
                <div className="bg-gradient-to-br from-primary to-accent p-4 rounded-2xl w-fit mb-6">
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                
                <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold mb-4 w-fit">
                  Step {index + 1}
                </div>
                
                <h3 className="text-2xl font-bold mb-3 text-vault-dark">
                  {step.title}
                </h3>
                
                <p className="text-lg font-medium text-primary mb-4">
                  {step.description}
                </p>
                
                <p className="text-muted-foreground">
                  {step.details}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Demo Chat Interface */}
        <div className="bg-card/30 rounded-3xl shadow-card p-8 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8 text-vault-dark">
            See Concierge in Action
          </h3>
          
          <div className="space-y-4 p-8">
            {/* User Message */}
            <div className="flex justify-end">
              <div className="bg-primary text-white rounded-2xl rounded-br-md px-6 py-4 max-w-md">
                <p>&quot;Should I switch to a cheaper phone plan?&quot;</p>
              </div>
            </div>
            
            {/* AI Response */}
            <div className="flex justify-start">
              <div className="bg-card text-vault-dark rounded-2xl rounded-bl-md px-6 py-4 max-w-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                    <Brain className="w-3 h-3 text-white" />
                  </div>
                  <span className="font-semibold text-sm">Concierge AI</span>
                </div>
                <p>
                  Based on your usage data from your vault, you use only 2GB/month but pay for unlimited. 
                  I found 3 plans that could save you <strong>$47/month</strong>. Your credit score and payment 
                  history qualify you for the best rates. Want me to help you switch?
                </p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs">
                    Show Plan Details
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs">
                    Calculate Savings
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              <strong>Only possible because Concierge knows your actual phone usage, budget, and financial goals</strong>
            </p>
            <Link href="/dashboard/vault/my-files">
              <Button className="gradient-hero text-white">
                Launch App
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};