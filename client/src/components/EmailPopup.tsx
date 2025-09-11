import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmailPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onEmailSubmit: (email: string) => void;
}

export default function EmailPopup({ isOpen, onClose, onEmailSubmit }: EmailPopupProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address to continue.",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Submit email for demo access
      onEmailSubmit(email);
      
      toast({
        title: "Welcome to Budget Builder Agent!",
        description: "Taking you to the demo...",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-[hsl(221,83%,53%)] rounded-2xl">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-center text-xl font-bold">
            Try Budget Builder Agent Demo
          </DialogTitle>
          <DialogDescription className="text-center">
            Enter your email to get started with your personalized financial coaching experience.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="pl-11 py-3 text-base"
                disabled={isSubmitting}
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-[hsl(221,83%,53%)] hover:bg-[hsl(221,83%,45%)]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Start Demo"
              )}
            </Button>
          </div>
        </form>
        
        <div className="text-xs text-gray-500 text-center mt-4">
          This demo is for educational purposes only. Not financial advice.
        </div>
      </DialogContent>
    </Dialog>
  );
}