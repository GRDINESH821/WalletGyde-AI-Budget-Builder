import { Shield, Info, AlertTriangle, Lock, ShieldQuestion, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";

const securityFeatures = [
  {
    icon: Lock,
    title: "Data Privacy",
    description: "Your financial conversations stay private and secure",
    color: "hsl(221,83%,53%)"
  },
  {
    icon: ShieldQuestion,
    title: "No Investment Advice",
    description: "Educational guidance only, never specific investment recommendations",
    color: "hsl(158,64%,52%)"
  },
  {
    icon: GraduationCap,
    title: "Educational Focus",
    description: "Helping you learn financial principles and frameworks",
    color: "hsl(43,89%,38%)"
  }
];

export default function SecuritySection() {
  return (
    <section id="security" className="py-20 bg-gradient-to-br from-[hsl(210,40%,98%)] to-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="w-20 h-20 bg-gradient-to-br from-[hsl(221,83%,53%)] to-[hsl(221,83%,45%)] rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Security & Guardrails
          </h2>
        </motion.div>
        
        <motion.div 
          className="bg-white rounded-3xl p-8 lg:p-12 shadow-xl"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-[hsl(221,83%,53%)]/10 to-[hsl(158,64%,52%)]/10 rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-3 flex items-center">
                <Info className="w-6 h-6 text-[hsl(221,83%,53%)] mr-3" />
                Educational Purpose
              </h3>
              <p className="text-[hsl(215,16%,47%)] leading-relaxed">
                Walletgyde AI uses educational financial principles only — we do not offer personalized investment advice. Always consult a licensed advisor before making major financial decisions.
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-[hsl(43,89%,38%)]/10 to-red-100 rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-3 flex items-center">
                <AlertTriangle className="w-6 h-6 text-[hsl(43,89%,38%)] mr-3" />
                LLM Guardrails
              </h3>
              <p className="text-[hsl(215,16%,47%)] leading-relaxed">
                "This is educational context, not personalized financial advice." Our AI is designed with built-in safeguards to ensure all responses focus on education and established financial principles.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              {securityFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <motion.div 
                    key={feature.title}
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                      style={{ backgroundColor: feature.color + "33" }}
                    >
                      <IconComponent 
                        className="w-8 h-8" 
                        style={{ color: feature.color }}
                      />
                    </div>
                    <h4 className="font-semibold mb-2">{feature.title}</h4>
                    <p className="text-sm text-[hsl(215,16%,47%)]">{feature.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
