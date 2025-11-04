import { Button } from "@/components/ui/button";
import { AnimatedCounter } from "./components/AnimatedCounter";
import { ArrowRight, Shield, Brain, Zap, Star, Database, Lock, Network, Binary, HardDrive, ServerCog } from "lucide-react";
import Link from "next/link";

export const HeroSection = () => {
  return (
    <section className="pitch-section relative overflow-hidden p-44 h-screen">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/80 to-primary/60"></div>
      

      <div className="absolute inset-0 overflow-hidden opacity-10 z-10">
        <Database className="absolute w-8 h-8 text-white top-20 left-[10%] animate-pulse" style={{animationDelay: '0s', animationDuration: '3s'}} />
        <ServerCog className="absolute w-10 h-10 text-white top-40 right-[15%] animate-pulse" style={{animationDelay: '0.5s', animationDuration: '4s'}} />
        <Lock className="absolute w-6 h-6 text-white bottom-32 left-[20%] animate-pulse" style={{animationDelay: '1s', animationDuration: '3.5s'}} />
        <Database className="absolute w-12 h-12 text-white top-[60%] right-[25%] animate-pulse" style={{animationDelay: '1.5s', animationDuration: '4.5s'}} />
        <HardDrive className="absolute w-7 h-7 text-white bottom-[20%] right-[10%] animate-pulse" style={{animationDelay: '2s', animationDuration: '3s'}} />
        <ServerCog className="absolute w-9 h-9 text-white top-[30%] left-[5%] animate-pulse" style={{animationDelay: '2.5s', animationDuration: '5s'}} />
        <Database className="absolute w-6 h-6 text-white bottom-40 right-[30%] animate-pulse" style={{animationDelay: '3s', animationDuration: '3.5s'}} />
        <ServerCog className="absolute w-8 h-8 text-white top-[50%] left-[30%] animate-pulse" style={{animationDelay: '3.5s', animationDuration: '4s'}} />
      </div>

      <div className="absolute inset-0 backdrop-blur-3xl dark:bg-white/5 bg-black/5"></div>
      
      <div className="absolute inset-0 overflow-hidden opacity-10">
        <div className="absolute w-2 h-2 bg-white rounded-full top-[15%] left-[12%] animate-ping" style={{animationDuration: '2s'}}></div>
        <div className="absolute w-3 h-3 bg-white rounded-full top-[25%] right-[18%] animate-ping" style={{animationDuration: '3s', animationDelay: '0.5s'}}></div>
        <div className="absolute w-2 h-2 bg-white rounded-full bottom-[30%] left-[8%] animate-ping" style={{animationDuration: '2.5s', animationDelay: '1s'}}></div>
        <div className="absolute w-3 h-3 bg-white rounded-full top-[70%] right-[12%] animate-ping" style={{animationDuration: '3.5s', animationDelay: '1.5s'}}></div>
        <div className="absolute w-2 h-2 bg-white rounded-full top-[45%] left-[15%] animate-ping" style={{animationDuration: '2s', animationDelay: '2s'}}></div>
        <div className="absolute w-3 h-3 bg-white rounded-full bottom-[45%] right-[20%] animate-ping" style={{animationDuration: '3s', animationDelay: '2.5s'}}></div>
      </div>


      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }}></div>

      <div className="section-container relative z-10">
        <div className="text-center max-w-5xl mx-auto">
     
          <div className="slide-in-up">
            <div className="items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 px-4 py-2 rounded-full mb-8 hidden">
              <Shield className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">
                Powered by 0G Blockchain
              </span>
            </div>
            <p className="text-2xl md:text-7xl text-foreground/70 mb-6 drop-shadow-lg tracking-tight">
              Personal AI Advisors Built On{" "}<br/>
              <strong className="text-white">Your Data, Owned by You</strong>
            </p>

            <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto mb-12 leading-relaxed drop-shadow-md">
              Your AI learns exclusively from <strong className="text-white/95">YOUR life</strong>,
              powered by a decentralized, encrypted data vault and backed by{" "}
              <strong className="text-white/95">INFT ownership</strong>. Private. Personalized.
              Transferable.
            </p>
          </div>

          {/* Key Metrics */}
          <div className="fade-in-up grid-cols-1 md:grid-cols-3 gap-8 mb-12 hidden">
            <div className="text-center p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl hover-lift">
              <AnimatedCounter
                value="127"
                prefix="$"
                suffix="B"
                className="block mb-2 text-white"
              />
              <p className="text-sm font-medium text-white/70">
                Personal data market size
              </p>
            </div>
            <div className="text-center p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl hover-lift">
              <AnimatedCounter value="2.5" suffix="B" className="block mb-2 text-white" />
              <p className="text-sm font-medium text-white/70">
                People using AI assistants
              </p>
            </div>
            <div className="text-center p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl hover-lift">
              <AnimatedCounter value="0" suffix="%" className="block mb-2 text-white" />
              <p className="text-sm font-medium text-white/70">
                Currently own their AI&apos;s training data — now possible
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="fade-in-up flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/dashboard/vault/my-files" passHref>
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-2xl font-semibold">
                Launch App
              </Button>
            </Link>

            <Button
              variant="outline"
              size="lg"
              className="border-white/40 text-white hover:bg-white/10 backdrop-blur-sm"
            >
              Watch Demo
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="fade-in-up mt-16 flex flex-wrap justify-center gap-8 text-sm text-white">
            <div className="flex items-center gap-2 backdrop-blur-sm bg-white/5 px-5 py-1 rounded-full shadow-md">
              <span>--SOC2 Compliant--</span>
            </div>
            <div className="flex items-center gap-2 backdrop-blur-sm bg-white/5 px-5 py-1 rounded-full shadow-md">
              <span>--Built on 0G AI--</span>
            </div>
            <div className="flex items-center gap-2 backdrop-blur-sm bg-white/5 px-5 py-1 rounded-full shadow-md">
              <span>--End-to-End Encrypted--</span>
            </div>
            <div className="flex items-center gap-2 backdrop-blur-sm bg-white/5 px-5 py-1 rounded-full shadow-md">
              <span>--INFT-Backed Data Ownership--</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};