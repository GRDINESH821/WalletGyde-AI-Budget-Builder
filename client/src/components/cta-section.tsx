import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Rocket, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function CTASection() {
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const { data: signupCount } = useQuery({
    queryKey: ["/api/beta-signup-count"],
  });

  const signupMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("POST", "/api/beta-signup", { email });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Welcome to the beta!",
          description: data.message,
        });
        setEmail("");
      } else {
        toast({
          title: "Signup failed",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Signup failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }
    signupMutation.mutate(email);
  };

  return (
    <section className="py-20 bg-gradient-to-br from-[hsl(221,83%,53%)] via-[hsl(221,83%,45%)] to-[hsl(158,64%,52%)] relative overflow-hidden">
      <div className="absolute inset-0 star-pattern opacity-10"></div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Take control with an AI-powered plan
          </h2>
          <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
            Start your budget and debt plan in minutes. Get early access to the Budget Builder Agent.
          </p>
        </motion.div>
        
        {/* Beta Signup Form */}
        <motion.div 
          className="max-w-md mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-6 py-4 text-lg border-2 border-white/30 bg-white/90 backdrop-blur-lg text-gray-900 placeholder-gray-600 focus:border-white focus:ring-2 focus:ring-white/30 rounded-xl"
                disabled={signupMutation.isPending}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <Mail className="w-5 h-5 text-gray-500" />
              </div>
            </div>
            <Button
              type="submit"
              disabled={signupMutation.isPending}
              className="w-full bg-white text-[hsl(221,83%,53%)] px-8 py-4 text-lg font-bold hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg rounded-xl"
            >
              <Rocket className="w-5 h-5 mr-2" />
              {signupMutation.isPending ? "Starting..." : "Start my plan"}
            </Button>
          </form>
          
          <p className="text-blue-200 text-sm mt-4">
            No spam. Unsubscribe anytime. Early access notifications only.
          </p>
          <p className="text-blue-200 text-xs mt-2 opacity-75">
            For educational use only. Not financial advice.
          </p>
        </motion.div>
        

      </div>
    </section>
  );
}
