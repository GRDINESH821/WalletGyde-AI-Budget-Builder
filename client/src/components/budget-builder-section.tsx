import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Bot, Send, Shield, Lock, Database } from "lucide-react";

const chatMessages = [
  {
    type: "bot",
    content: "I'll build your budget + debt plan in minutes.",
    avatar: "🤖"
  },
  {
    type: "user", 
    content: "List my debts."
  },
  {
    type: "bot",
    content: "Got it. Balance: $5,000 @ 19% APR, $2,500 @ 8% APR, $1,200 @ 22% APR. Want to use Snowball (motivation) or Avalanche (save interest)?",
    avatar: "🤖"
  },
  {
    type: "user",
    content: "Snowball."
  },
  {
    type: "bot",
    content: "✅ Plan built. Pay $300 on Card 3 first. Projected debt-free in 14 months.",
    avatar: "🤖"
  }
];

const quickReplies = ["Switch to Avalanche", "Explain Snowball", "Edit numbers"];

export default function BudgetBuilderSection() {
  const [isTyping, setIsTyping] = useState(false);

  return (
    <section className="py-20 bg-gradient-to-br from-[hsl(221,83%,53%)]/5 to-[hsl(158,64%,52%)]/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center space-x-2 bg-[hsl(221,83%,53%)]/10 px-4 py-2 rounded-full mb-6">
              <Bot className="w-4 h-4 text-[hsl(221,83%,53%)]" />
              <span className="text-[hsl(221,83%,53%)] font-medium text-sm">Budget Builder Agent</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Powered by{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(221,83%,53%)] to-[hsl(158,64%,52%)]">
                Walletgyde AI 🤖
              </span>
            </h2>
            
            <p className="text-xl text-[hsl(215,16%,47%)] leading-relaxed mb-8">
              Unlike generic chatbots trained on general internet information, Budget Builder Agent is specifically trained on financial APIs and proven budgeting principles. Get personalized plans, not generic advice.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-[hsl(158,64%,52%)] rounded-full mt-2"></div>
                <div>
                  <h4 className="font-semibold text-gray-900">Ask for income, bills, debts</h4>
                  <p className="text-sm text-[hsl(215,16%,47%)]">Monthly take-home, fixed bills, debt balances with APR</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-[hsl(158,64%,52%)] rounded-full mt-2"></div>
                <div>
                  <h4 className="font-semibold text-gray-900">Offer Snowball or Avalanche</h4>
                  <p className="text-sm text-[hsl(215,16%,47%)]">Motivation-first or interest-savings strategy</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-[hsl(158,64%,52%)] rounded-full mt-2"></div>
                <div>
                  <h4 className="font-semibold text-gray-900">Output budget + payoff dates</h4>
                  <p className="text-sm text-[hsl(215,16%,47%)]">Monthly categories, debt order, one next action</p>
                </div>
              </div>
            </div>

            {/* Security Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2 text-sm text-[hsl(215,16%,47%)]">
                <Shield className="w-4 h-4 text-[hsl(158,64%,52%)]" />
                <span>Local encryption</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-[hsl(215,16%,47%)]">
                <Lock className="w-4 h-4 text-[hsl(158,64%,52%)]" />
                <span>No selling data</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-[hsl(215,16%,47%)]">
                <Database className="w-4 h-4 text-[hsl(158,64%,52%)]" />
                <span>Built 120k+ budgets</span>
              </div>
            </div>
          </motion.div>

          {/* Right Content - Mobile Phone Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="relative flex justify-center"
          >
            {/* iPhone Mockup Container */}
            <div className="relative">
              {/* Phone Frame */}
              <div className="w-[280px] h-[580px] bg-gray-900 rounded-[50px] p-2 shadow-2xl">
                {/* Screen */}
                <div className="w-full h-full bg-black rounded-[42px] p-1">
                  <div className="w-full h-full bg-white rounded-[38px] overflow-hidden">
                    {/* Status Bar */}
                    <div className="bg-white px-6 py-2 flex justify-between items-center text-black text-sm font-medium">
                      <span>9:41</span>
                      <div className="flex items-center space-x-1">
                        <div className="w-4 h-2 border border-black rounded-sm">
                          <div className="w-3 h-1 bg-black rounded-sm"></div>
                        </div>
                      </div>
                    </div>

                    {/* App Header */}
                    <div className="bg-gradient-to-r from-[hsl(221,83%,53%)] to-[hsl(158,64%,52%)] p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white text-sm">Budget Builder</h3>
                          <p className="text-white/80 text-xs">AI Financial Coach</p>
                        </div>
                        <div className="flex-1"></div>
                        <div className="flex space-x-1">
                          <div className="w-1.5 h-1.5 bg-[hsl(158,64%,52%)] rounded-full animate-pulse"></div>
                          <div className="w-1.5 h-1.5 bg-[hsl(158,64%,52%)] rounded-full animate-pulse" style={{animationDelay: "0.2s"}}></div>
                          <div className="w-1.5 h-1.5 bg-[hsl(158,64%,52%)] rounded-full animate-pulse" style={{animationDelay: "0.4s"}}></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Chat Messages */}
                    <div className="p-3 h-[380px] overflow-y-auto bg-gray-50">
                      <div className="space-y-3">
                        {chatMessages.map((message, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.5 }}
                            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[75%] rounded-xl px-3 py-2 text-xs ${
                              message.type === 'user' 
                                ? 'bg-[hsl(221,83%,53%)] text-white' 
                                : 'bg-white text-gray-800 shadow-sm border'
                            }`}>
                              {message.type === 'bot' && (
                                <div className="flex items-center space-x-1 mb-1">
                                  <span className="text-xs">{message.avatar}</span>
                                  <span className="text-xs font-medium text-[hsl(221,83%,53%)]">Budget Builder</span>
                                </div>
                              )}
                              <p className="text-xs leading-relaxed">{message.content}</p>
                            </div>
                          </motion.div>
                        ))}
                        
                        {isTyping && (
                          <div className="flex justify-start">
                            <div className="bg-white text-gray-800 shadow-sm border rounded-xl px-3 py-2">
                              <div className="flex items-center space-x-1 mb-1">
                                <span className="text-xs">🤖</span>
                                <span className="text-xs font-medium text-[hsl(221,83%,53%)]">Budget Builder</span>
                              </div>
                              <div className="flex space-x-1">
                                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: "0.1s"}}></div>
                                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: "0.2s"}}></div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Input Area */}
                    <div className="p-3 bg-white border-t">
                      <div className="flex flex-wrap gap-1 mb-2">
                        {quickReplies.map((reply, index) => (
                          <button
                            key={index}
                            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors"
                            onClick={() => setIsTyping(!isTyping)}
                          >
                            {reply}
                          </button>
                        ))}
                      </div>
                      <div className="flex space-x-2">
                        <div className="flex-1 bg-gray-100 rounded-full px-3 py-2 text-xs text-gray-500">
                          Type your message...
                        </div>
                        <button className="w-8 h-8 bg-[hsl(221,83%,53%)] rounded-full flex items-center justify-center text-white hover:bg-[hsl(221,83%,45%)] transition-colors">
                          <Send className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating elements around phone */}
              <div className="absolute -top-4 -right-4 w-12 h-12 bg-[hsl(158,64%,52%)]/20 rounded-full animate-pulse-slow"></div>
              <div className="absolute -bottom-4 -left-4 w-10 h-10 bg-[hsl(43,89%,38%)]/20 rounded-full animate-pulse-slow" style={{animationDelay: "-1s"}}></div>
              
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-[hsl(221,83%,53%)]/10 to-[hsl(158,64%,52%)]/10 rounded-[50px] blur-xl scale-110 -z-10"></div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}