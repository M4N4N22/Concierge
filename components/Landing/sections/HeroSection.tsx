import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="landing-hero px-6 pb-16  sm:px-8 sm:pb-24 s">
      <div className="relative z-[1] mx-auto max-w-5xl">
        {/* Dominant visual plane */}
        <div
          className="landing-fade relative mx-auto h-[14rem] w-full max-w-3xl sm:h-[18rem]"
          style={{ animationDelay: "40ms" }}
          aria-hidden
        >
      
         
        </div>

        <div className="mx-auto  max-w-5xl text-center ">
          <h1
            className="landing-fade font-display text-9xl font-light tracking-[-0.07em]  text-white/70 sm:text-9xl lg:text-[7.25rem]"
            style={{ animationDelay: "120ms" }}
          >
            <span className="text-white/95">Intillegence</span> you <span className="text-brand">own</span>.
          </h1>

          <p
            className="landing-fade mx-auto mt-7 max-w-3xl text-base leading-relaxed text-white/70 sm:text-lg"
            style={{ animationDelay: "200ms" }}
          >
            A private vault, knowledge from Compute, and an identity you own. <br/>
            Chat with it or monetize it without sharing private
            files.
          </p>

          <div
            className="landing-fade mt-8 flex flex-wrap items-center justify-center gap-3"
            style={{ animationDelay: "280ms" }}
          >
            <div className="flex w-full max-w-md overflow-hidden rounded-full border-4 border-[var(--landing-line)] bg-brand shadow-[0_16px_40px_-20px_rgba(10,10,20,0.35)] sm:w-auto">
              <span className="hidden flex-1 items-center px-5 text-sm text-white sm:flex">
                Powered by <span className=" ml-1"> 0G</span>
              </span>
              <Button
                asChild
                size="lg"
                className="h-12 rounded-full bg-[var(--landing-ink)] px-7 text-white hover:bg-[var(--landing-ink)]/90"
              >
                <Link href="/dashboard">
                  Launch app
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
