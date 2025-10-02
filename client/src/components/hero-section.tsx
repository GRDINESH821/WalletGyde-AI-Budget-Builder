import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import RobotIcon from "@/components/RobotIcon";


interface HeroSectionProps {
  onJoinBeta: () => void;
  onSeeDemo: () => void;
}

export default function HeroSection({ onJoinBeta, onSeeDemo }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 gradient-bg star-pattern opacity-5"></div>
      <div className="absolute top-20 left-10 w-20 h-20 bg-[hsl(158,64%,52%)]/20 rounded-full animate-float"></div>
      <div className="absolute bottom-32 right-16 w-16 h-16 bg-[hsl(43,89%,38%)]/20 rounded-full animate-float" style={{animationDelay: "-2s"}}></div>
      <div className="absolute top-40 right-20 w-12 h-12 bg-[hsl(221,83%,53%)]/20 rounded-full animate-float" style={{animationDelay: "-4s"}}></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center space-x-2 bg-[hsl(221,83%,53%)]/10 px-4 py-2 rounded-full mb-6">
              <Star className="w-4 h-4 text-[hsl(221,83%,53%)] fill-[hsl(221,83%,53%)]" />
              <span className="text-[hsl(221,83%,53%)] font-medium text-sm">Budget Builder Agent <RobotIcon className="inline ml-1" size="sm" useCustomIcon={true} customIconPath="/logos/BudgetBuilder_square.png" /></span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Take control of your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(221,83%,53%)] to-[hsl(158,64%,52%)]">
                budget & debt
              </span>
            </h1>
            
            <p className="text-xl text-[hsl(215,16%,47%)] leading-relaxed mb-8 max-w-2xl mx-auto">
              Get a step-by-step plan, not lectures. AI builds your monthly budget plus debt payoff strategy with projected dates in ~3 minutes.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={onSeeDemo}
                size="lg"
                className="bg-[hsl(221,83%,53%)] text-white px-8 py-4 text-lg font-semibold hover:bg-[hsl(221,83%,45%)] transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                See Demo
              </Button>
            </div>


          </motion.div>
          

        </div>
      </div>
    </section>
  );
}
