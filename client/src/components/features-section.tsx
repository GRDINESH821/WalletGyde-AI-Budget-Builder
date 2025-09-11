import { Calculator, CreditCard, PiggyBank, Target, Calendar, TrendingDown, Percent } from "lucide-react";
import { motion } from "framer-motion";

const budgetPrinciples = [
  {
    icon: Calculator,
    title: "Zero-based budgeting",
    description: "Every dollar gets assigned a job. Income minus expenses equals zero.",
    color: "hsl(221,83%,53%)"
  },
  {
    icon: Target,
    title: "50/30/20 rule",
    description: "50% needs, 30% wants, 20% savings. Simple framework for balanced spending.",
    color: "hsl(158,64%,52%)"
  },
  {
    icon: PiggyBank,
    title: "Sinking funds & emergency fund",
    description: "Save for planned expenses and unexpected costs. Build 3-6 months expenses.",
    color: "hsl(43,89%,38%)"
  },
  {
    icon: CreditCard,
    title: "Snowball vs. Avalanche",
    description: "Snowball: smallest balance first (motivation). Avalanche: highest APR first (math).",
    color: "hsl(0,84%,60%)"
  },
  {
    icon: Percent,
    title: "APR & minimums",
    description: "Annual Percentage Rate shows true cost. Always pay minimums to avoid penalties.",
    color: "hsl(271,91%,65%)"
  },
  {
    icon: Calendar,
    title: "Fixed vs. variable expenses",
    description: "Fixed: rent, insurance. Variable: groceries, entertainment. Track both for control.",
    color: "hsl(231,48%,48%)"
  },
  {
    icon: TrendingDown,
    title: "DTI explained",
    description: "Debt-to-Income ratio. Keep total monthly debt payments under 36% of income.",
    color: "hsl(158,64%,32%)"
  }
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-gradient-to-br from-[hsl(210,40%,98%)] to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Budgeting & Debt Principles
          </h2>
          <p className="text-xl text-[hsl(215,16%,47%)] max-w-3xl mx-auto">
            Educational concepts explained in simple language
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgetPrinciples.map((principle, index) => {
            const IconComponent = principle.icon;
            return (
              <motion.div
                key={principle.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glass-card rounded-2xl p-6 hover:shadow-xl transition-all duration-300 group bg-white/50 backdrop-blur-sm border border-white/20"
              >
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"
                  style={{ 
                    background: `linear-gradient(135deg, ${principle.color}, ${principle.color}dd)` 
                  }}
                >
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2">{principle.title}</h3>
                <p className="text-sm text-[hsl(215,16%,47%)] leading-relaxed">{principle.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
