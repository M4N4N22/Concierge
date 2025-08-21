import { Database, Cpu, Shield, Activity } from "lucide-react";

export const TechnicalSection = () => {
  const techStack = [
    {
      icon: Database,
      title: "0G Storage",
      description: "Encrypted personal data vaults",
      details:
        "Decentralized storage with military-grade encryption keeps your data completely secure and private.",
    },
    {
      icon: Cpu,
      title: "0G Compute",
      description: "AI inference on your data",
      details:
        "Secure compute environment processes your data without exposing it, using zero-knowledge proofs.",
    },
    {
      icon: Shield,
      title: "0G Chain",
      description: "INFT smart contracts for AI ownership",
      details:
        "Blockchain-based ownership of your AI agent as a tradeable, upgradeable NFT asset.",
    },
    {
      icon: Activity,
      title: "0G DA",
      description: "Real-time data synchronization",
      details:
        "Data availability layer ensures your AI has instant access to your latest information.",
    },
  ];

  const userJourney = [
    {
      step: "1",
      title: "Data Upload",
      description:
        "Securely upload your personal files, documents, and data to your encrypted vault on 0G Storage.",
    },
    {
      step: "2",
      title: "AI Training",
      description:
        "Your personal INFT agent learns from your data using privacy-preserving AI on 0G Compute.",
    },
    {
      step: "3",
      title: "Personal Insights",
      description:
        "Get intelligent, personalized advice that only your AI agent can provide based on your data.",
    },
    {
      step: "4",
      title: "Verifiable Results",
      description:
        "All AI operations are recorded on 0G Chain, providing transparent proof of privacy protection.",
    },
  ];

  return (
    <section className="pitch-section bg-vault-dark  relative overflow-hidden p-36">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-vault-dark to-vault-dark-light" />
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-accent/20 rounded-full blur-3xl" />

      <div className="section-container relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-medium mb-6">
            Powered by <span className="text-gradient">Next-Generation</span>{" "}
            Blockchain AI
          </h2>
          <p className="text-xl  max-w-3xl mx-auto">
            Built on 0G&apos;s revolutionary infrastructure - the only blockchain
            designed specifically for AI applications with true privacy
            guarantees.
          </p>
        </div>

        {/* Technical Stack */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {techStack.map((tech, index) => (
            <div
              key={index}
              className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 hover-lift"
            >
              <div className="bg-gradient-to-br from-primary to-accent p-3 rounded-xl w-fit mb-4">
                <tech.icon className="w-6 h-6 text-white" />
              </div>

              <h3 className="text-xl font-bold mb-2">{tech.title}</h3>

              <p className="text-primary font-medium mb-3">
                {tech.description}
              </p>

              <p className="text-sm text-foreground/70">{tech.details}</p>
            </div>
          ))}
        </div>

        {/* User Journey Flow */}
        <div className="bg-card/50 backdrop-blur-sm rounded-3xl p-8">
          <h3 className="text-3xl font-bold text-center mb-8">
            How It Works: Your Data Journey
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {userJourney.map((journey, index) => (
              <div key={index} className="relative ">
                {/* Connection Line */}
                {index < userJourney.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-full w-full h-0.5 bg-gradient-to-r from-primary to-accent -translate-x-3 z-0" />
                )}

                <div className="relative z-10">
                  <div className="bg-gradient-to-br from-primary to-accent text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg mb-4 mx-auto">
                    {journey.step}
                  </div>

                  <h4 className="text-lg font-semibold mb-2 text-center">
                    {journey.title}
                  </h4>

                  <p className="text-sm text-foreground/70 text-center">
                    {journey.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy Layer Highlight */}
        <div className="mt-16 text-center">
          <div className=" rounded-3xl p-8 max-w-4xl mx-auto ">
            <h3 className="text-2xl font-bold mb-4">
              Privacy Layer: Zero-Knowledge Proofs
            </h3>
            <p className="text-lg text-foreground/80">
              Your data never leaves your control. AI training happens using
              cryptographic proofs that ensure your information remains
              completely private while still enabling personalized intelligence.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
