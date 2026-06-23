"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Check, Shield, Users, Zap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export const CTASection = () => {
  const [email, setEmail] = useState("");

  const benefits = [
    "Full vault upload and onchain registration",
    "Priority access to Agentic ID minting", 
    "0G Compute insights on your files",
    "Early access to vault chat and ecosystem features"
  ];

  const trustSignals = [
    { icon: Shield, text: "Built on 0G Storage, Compute & Chain" },
    { icon: Users, text: "Wallet-owned Agentic ID" },
    { icon: Zap, text: "End-to-end encrypted vault" }
  ];

  return (
    <section className="pitch-section bg-card/30  relative overflow-hidden p-36">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10" />
      <div className="absolute top-0 left-0 w-full h-full opacity-20">
        <div className="w-full h-full bg-white/5 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
      </div>
      
      <div className="section-container relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-medium mb-6">
            Start Your Agentic ID on 0G
          </h2>
          
          <p className="text-xl md:text-2xl mb-4 text-foreground/90">
            Upload, compute, mint — your personal intelligence stack is live on testnet.
          </p>
          
          <p className="text-lg mb-12 text-foreground/80">
            Join the 0G Bridge Buildathon journey or jump straight into the app.
          </p>

          {/* Email Signup */}
          <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 mb-12 max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Input
                type="email"
                placeholder="Enter your email for updates"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className=""
              />
              <Button 
                size="lg"
                className="bg-card text-primary hover:bg-white/90 font-semibold px-8 py-6 text-lg"
              >
                Get Updates
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>

            <Link href="/dashboard/vault/my-files" className="block mb-6">
              <Button size="lg" variant="outline" className="w-full font-semibold">
                Launch App
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            
            {/* Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-foreground/90">
                  <Check className="w-4 h-4 text-green-300 flex-shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trust Signals */}
          <div className="flex flex-wrap justify-center gap-8 text-sm">
            {trustSignals.map((signal, index) => (
              <div key={index} className="flex items-center gap-2 text-foreground/80">
                <signal.icon className="w-5 h-5" />
                <span>{signal.text}</span>
              </div>
            ))}
          </div>

          {/* Final Message */}
          <div className="mt-12 text-center">
            <p className="text-foreground/60 text-sm">
              No spam. Unsubscribe anytime. Your email stays private in your vault.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};