import { Check, X, AlertTriangle } from "lucide-react";

export const CompetitiveSection = () => {
  const features = [
    "Uses YOUR data",
    "Data ownership", 
    "Truly personalized",
    "Privacy guaranteed",
    "AI you can own/trade",
    "Cross-platform"
  ];

  const competitors = [
    {
      name: "ChatGPT/Claude",
      values: [false, false, false, false, false, true]
    },
    {
      name: "Google Assistant", 
      values: [false, false, false, false, false, true]
    },
    {
      name: "Notion AI",
      values: ["partial", false, false, false, false, "limited"]
    },
    {
      name: "Concierge",
      values: [true, true, true, true, true, true],
      highlight: true
    }
  ];

  const moats = [
    {
      title: "Technical Moat",
      description: "Only platform using 0G's full AI blockchain stack",
      detail: "3+ years ahead in decentralized AI architecture"
    },
    {
      title: "Data Network Effects", 
      description: "More users = better AI models = more valuable INFTs",
      detail: "Data stays private but insights improve collectively"
    },
    {
      title: "First-Mover Advantage",
      description: "First true personal AI platform",
      detail: "Building category-defining product"
    },
    {
      title: "Privacy-by-Design",
      description: "Can't be replicated by Big Tech",
      detail: "Conflicts with their surveillance business model"
    },
    {
      title: "INFT Ecosystem", 
      description: "Create new asset class: valuable, evolving AI agents",
      detail: "Network effects from agent marketplace"
    }
  ];

  const renderIcon = (value: boolean | string) => {
    if (value === true) return <Check className="w-5 h-5 text-green-500" />;
    if (value === false) return <X className="w-5 h-5 text-red-500" />;
    if (value === "partial" || value === "limited") return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    return <X className="w-5 h-5 text-red-500" />;
  };

  return (
    <section className="pitch-section bg-card/30 p-36">
      <div className="section-container">
        {/* Competitive Analysis */}
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-medium pb-6">
            Why <span className="text-gradient pb-4">Concierge Wins</span> vs. Alternatives
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We&apos;re not just another AI assistant. We&apos;re the only platform that puts you in complete control of your data and AI.
          </p>
        </div>

        <div className="bg-card rounded-3xl shadow-card p-12 mb-16 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 ">
                <th className="text-left p-4 font-semibold text-vault-dark">Feature</th>
                {competitors.map((competitor, index) => (
                  <th 
                    key={index}
                    className={`text-center p-4 font-semibold ${competitor.highlight ? 'text-primary' : 'text-vault-dark'}`}
                  >
                    {competitor.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((feature, featureIndex) => (
                <tr key={featureIndex} className="border-b  hover:bg-background">
                  <td className="p-4 font-medium text-vault-dark">{feature}</td>
                  {competitors.map((competitor, compIndex) => (
                    <td 
                      key={compIndex}
                      className={`text-center p-4 ${competitor.highlight ? 'bg-primary/5' : ''}`}
                    >
                      {renderIcon(competitor.values[featureIndex])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Competitive Moats */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-medium mb-6">
            Our <span className="text-gradient">Competitive Moats</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Five reasons why VaultMind can&apos;t be copied by competitors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {moats.map((moat, index) => (
            <div 
              key={index}
              className="bg-card rounded-2xl p-6 shadow-card hover-lift"
            >
              <div className="bg-gradient-to-br from-primary to-accent text-white rounded-lg w-12 h-12 flex items-center justify-center mb-4 font-bold text-lg">
                {index + 1}
              </div>
              
              <h3 className="text-xl font-bold mb-3 text-vault-dark">
                {moat.title}
              </h3>
              
              <p className="text-primary font-medium mb-2">
                {moat.description}
              </p>
              
              <p className="text-sm text-muted-foreground">
                {moat.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};