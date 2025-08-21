import { Button } from "@/components/ui/button";
import { AnimatedCounter } from "./components/AnimatedCounter";
import { ArrowRight, Shield, Brain, Zap, Star } from "lucide-react";
import Link from "next/link";

export const HeroSection = () => {
  return (
    <section className="pitch-section relative overflow-hidden p-36">
      <div className="section-container relative z-10">
        <div className="text-center max-w-5xl mx-auto">
          {/* Main Brand */}
          <div className="slide-in-up">
            <div className="items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-8 hidden">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary ">
                Powered by 0G Blockchain
              </span>
            </div>

            <h1 className="text-6xl md:text-8xl font-medium text-gradient pb-8">
              Concierge
            </h1>

            <p className="text-2xl md:text-3xl font-medium text-vault-dark mb-6">
              Personal AI Advisors Built On{" "}
              <strong>Your Data, Owned by You</strong>
            </p>

            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
              Your AI learns exclusively from <strong>YOUR life</strong>,
              powered by a decentralized, encrypted data vault and backed by{" "}
              <strong>INFT ownership</strong>. Private. Personalized.
              Transferable.
            </p>
          </div>

          {/* Key Metrics */}
          <div className="fade-in-up  grid-cols-1 md:grid-cols-3 gap-8 mb-12 hidden">
            <div className="text-center p-6 bg-card rounded-2xl shadow-card hover-lift">
              <AnimatedCounter
                value="127"
                prefix="$"
                suffix="B"
                className="block mb-2"
              />
              <p className="text-sm font-medium text-muted-foreground">
                Personal data market size
              </p>
            </div>
            <div className="text-center p-6 bg-card rounded-2xl shadow-card hover-lift">
              <AnimatedCounter value="2.5" suffix="B" className="block mb-2" />
              <p className="text-sm font-medium text-muted-foreground">
                People using AI assistants
              </p>
            </div>
            <div className="text-center p-6 bg-card rounded-2xl shadow-card hover-lift">
              <AnimatedCounter value="0" suffix="%" className="block mb-2" />
              <p className="text-sm font-medium text-muted-foreground">
                Currently own their AI’s training data — now possible
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="fade-in-up flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/dashboard/vault/my-files" passHref>
      <Button size="lg">
        Launch App
      </Button>
    </Link>

            <Button
              variant="outline"
              size="lg"
              className=""
            >
              Watch Demo
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="fade-in-up mt-16 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>--SOC2 Compliant--</span>
            </div>
            <div className="flex items-center gap-2">
              <span>--Built on 0G AI--</span>
            </div>
            <div className="flex items-center gap-2">
              <span>--End-to-End Encrypted--</span>
            </div>
            <div className="flex items-center gap-2">
              <span>--INFT-Backed Data Ownership--</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
