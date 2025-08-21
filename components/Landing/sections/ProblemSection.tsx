import { FolderOpen, Eye, Bot } from "lucide-react";
import { AnimatedCounter } from "./components/AnimatedCounter";

// Explicit type for stats
interface Stat {
  value: string;
  label: string;
  prefix?: string;
  suffix?: string;
}

interface Problem {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  stats: Stat[];
  gradient: string;
}

export const ProblemSection = () => {
  const problems: Problem[] = [
    {
      icon: FolderOpen,
      title: "Data Chaos",
      stats: [
        { value: "87", label: "different apps used by average person" },
        { value: "2.5", label: "hours/week searching for files" },
        { value: "12", label: "platforms where documents are scattered" }
      ],
      gradient: "from-red-500 to-orange-500"
    },
    {
      icon: Eye,
      title: "Privacy Invasion",
      stats: [
        { value: "100", prefix: "$", suffix: "B+", label: "made annually from your personal data" },
        { value: "0", suffix: "%", label: "of profits you receive from your data" },
        { value: "73", suffix: "%", label: "of people unaware of data collection extent" }
      ],
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: Bot,
      title: "Generic AI Limitations",
      stats: [
        { value: "0", suffix: "%", label: "ChatGPT knows about your spending habits" },
        { value: "0", suffix: "%", label: "Can give personalized financial advice" },
        { value: "100", suffix: "%", label: "One-size-fits-all solutions don't work" }
      ],
      gradient: "from-blue-500 to-cyan-500"
    }
  ];

  return (
    <section className="pitch-section  bg-card/30 p-36">
      <div className="section-container">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-medium mb-6">
            The <span className="text-primary">$127B</span> Personal Data Problem
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Your data creates massive value for Big Tech, but you get generic AI responses that don&apos;t understand your life.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {problems.map((problem, index) => (
            <div 
              key={index}
              className="bg-card/30 rounded-3xl p-8 shadow-card hover-lift transition-all duration-500"
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${problem.gradient} mb-6`}>
                <problem.icon className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold mb-6 text-vault-dark">
                {problem.title}
              </h3>
              
              <div className="space-y-4">
                {problem.stats.map((stat, statIndex) => (
                  <div key={statIndex} className="text-center p-4 bg-card rounded-xl">
                    <div className="text-3xl font-bold text-primary mb-1">
                      <AnimatedCounter 
                        value={stat.value}
                        prefix={stat.prefix}
                        suffix={stat.suffix}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Visual Impact */}
        <div className="mt-16 text-center">
          <div className=" rounded-3xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-vault-dark mb-4">
              The Result: You Create the Value, Big Tech Keeps the Profits
            </h3>
            <p className="text-lg text-muted-foreground">
              Your personal data generates billions in revenue, but you get generic AI that doesn&apos;t know 
              if you should switch phone plans, invest in stocks, or make major life decisions.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
