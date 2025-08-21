import { TrendingUp, Users, DollarSign, Zap } from "lucide-react";
import { AnimatedCounter } from "./components/AnimatedCounter";

export const MarketSection = () => {
  const marketData = [
    {
      label: "TAM (Total Addressable Market)",
      value: "350",
      suffix: "B",
      description: "AI + Personal Data + Storage markets combined",
      color: "from-purple-500 to-pink-500"
    },
    {
      label: "SAM (Serviceable Addressable Market)", 
      value: "47",
      suffix: "B",
      description: "AI assistants + cloud storage",
      color: "from-blue-500 to-cyan-500"
    },
    {
      label: "SOM (Serviceable Obtainable Market)",
      value: "2.1",
      suffix: "B", 
      description: "Privacy-focused AI tools",
      color: "from-green-500 to-emerald-500"
    }
  ];

  const trends = [
    {
      icon: Users,
      stat: "73%",
      label: "AI adoption rate among consumers",
      growth: "+40% YoY"
    },
    {
      icon: DollarSign,
      stat: "86%",
      label: "Want data ownership control",
      growth: "+25% YoY"
    },
    {
      icon: Zap,
      stat: "40%",
      label: "Annual growth in decentralized tech",
      growth: "Accelerating"
    }
  ];

  return (
    <section className="pitch-section  p-36">
      <div className="section-container">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-medium mb-6">
            A <span className="text-primary">Massive Market</span> Waiting for Disruption
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            The convergence of AI, personal data, and privacy creates an unprecedented opportunity to build the next $100B+ platform.
          </p>
        </div>

        {/* Market Size Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {marketData.map((market, index) => (
            <div 
              key={index}
              className="bg-card rounded-3xl p-8 shadow-card hover-lift relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${market.color} opacity-50 rounded-full -translate-y-8 translate-x-8`} />
              
              <div className="relative z-10">
                <h3 className="text-lg font-semibold mb-2 text-vault-dark">
                  {market.label}
                </h3>
                
                <div className="mb-4">
                  <span className="text-primary font-bold text-sm">$</span>
                  <AnimatedCounter 
                    value={market.value}
                    suffix={market.suffix}
                    className="text-4xl md:text-5xl font-bold text-primary"
                  />
                </div>
                
                <p className="text-muted-foreground text-sm">
                  {market.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Market Trends */}
        <div className="bg-card rounded-3xl p-12">
          <h3 className="text-3xl font-bold text-center mb-8 text-vault-dark">
            Market Trends Driving Growth
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {trends.map((trend, index) => (
              <div key={index} className="text-center">
                <div className="bg-gradient-to-br from-primary to-accent p-4 rounded-2xl w-fit mx-auto mb-4">
                  <trend.icon className="w-8 h-8 text-white" />
                </div>
                
                <div className="mb-2">
                  <AnimatedCounter 
                    value={trend.stat.replace('%', '')}
                    suffix="%"
                    className="text-3xl font-bold text-primary"
                  />
                </div>
                
                <p className="font-medium text-vault-dark mb-1">
                  {trend.label}
                </p>
                
                <div className="inline-flex items-center gap-1  text-green-300  px-2 py-1 rounded-full text-xs font-semibold">
                  <TrendingUp className="w-3 h-3" />
                  {trend.growth}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Market Insight */}
        <div className="mt-16 text-center">
          <div className=" rounded-3xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-vault-dark mb-4">
              Perfect Storm of Market Forces
            </h3>
            <p className="text-lg text-muted-foreground">
              AI adoption is exploding, privacy concerns are at an all-time high, and consumers want control of their data. 
              VaultMind sits at the intersection of these massive trends, positioned to capture significant market share 
              as the first-mover in personal AI ownership.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};