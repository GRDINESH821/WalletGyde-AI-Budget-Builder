import { Star, Bot, CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";

const comparisons = [
  {
    title: "Trained on trusted financial APIs",
    description: "Real-time market data, economic indicators, and verified financial information",
    color: "hsl(221,83%,53%)"
  },
  {
    title: "Follows proven financial frameworks",
    description: "50/30/20 budgeting, debt snowball/avalanche, FIRE principles, and more",
    color: "hsl(158,64%,52%)"
  },
  {
    title: "Targeted financial learning",
    description: "Personalized insights based on your financial situation, not generic advice",
    color: "hsl(43,89%,38%)"
  }
];

export default function ComparisonSection() {
  return (
    <section id="comparison" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Why not just use ChatGPT?
          </h2>
          <p className="text-xl text-[hsl(215,16%,47%)]">
            See the difference between generic AI and specialized financial coaching
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Comparison Chart */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-[hsl(221,83%,53%)]/5 to-[hsl(221,83%,53%)]/10 rounded-2xl">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-[hsl(221,83%,53%)] rounded-xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-white fill-white" />
                </div>
                <div>
                  <h4 className="font-semibold">Walletgyde AI</h4>
                  <p className="text-sm text-[hsl(215,16%,47%)]">Specialized financial AI</p>
                </div>
              </div>
              <CheckCircle className="w-8 h-8 text-[hsl(158,64%,52%)]" />
            </div>
            
            <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl opacity-60">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-400 rounded-xl flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold">Generic Chatbot</h4>
                  <p className="text-sm text-[hsl(215,16%,47%)]">General knowledge AI</p>
                </div>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </motion.div>
          
          {/* Feature Comparison */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            {comparisons.map((comparison, index) => (
              <div 
                key={comparison.title}
                className="p-6 rounded-2xl border-2 border-opacity-20 bg-opacity-5"
                style={{ 
                  borderColor: comparison.color,
                  backgroundColor: comparison.color + "0D"
                }}
              >
                <div className="flex items-start space-x-3">
                  <CheckCircle 
                    className="w-5 h-5 mt-1 flex-shrink-0" 
                    style={{ color: comparison.color }}
                  />
                  <div>
                    <h4 className="font-semibold mb-2">{comparison.title}</h4>
                    <p className="text-sm text-[hsl(215,16%,47%)]">{comparison.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
