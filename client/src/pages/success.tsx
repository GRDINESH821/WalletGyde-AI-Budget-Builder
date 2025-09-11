import { useState, useEffect } from "react";
import { CheckCircle, X, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";

type AnimationState = "loading" | "success" | "error";

export default function SuccessPage() {
  const { user, isLoading } = useAuth();
  const [animationState, setAnimationState] = useState<AnimationState>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate loading and check for success/error
    const timer = setTimeout(() => {
      if (user) {
        setAnimationState("success");
      } else if (!isLoading) {
        setAnimationState("error");
        setError("Authentication failed - Please try signing in again");
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [user, isLoading]);

  const LoadingSpinner = () => (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="w-16 h-16"
    >
      <Loader2 className="w-16 h-16 text-[hsl(221,83%,53%)]" />
    </motion.div>
  );

  const SuccessIcon = () => (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ 
        type: "spring", 
        stiffness: 200, 
        damping: 15,
        delay: 0.2 
      }}
      className="w-16 h-16"
    >
      <CheckCircle className="w-16 h-16 text-green-500" />
    </motion.div>
  );

  const ErrorIcon = () => (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ 
        type: "spring", 
        stiffness: 200, 
        damping: 15,
        delay: 0.2 
      }}
      className="w-16 h-16"
    >
      <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
        <X className="w-8 h-8 text-white" />
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(221,83%,53%)] via-[hsl(221,83%,45%)] to-[hsl(158,64%,52%)] flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center"
      >
        <div className="flex justify-center mb-6">
          <AnimatePresence mode="wait">
            {animationState === "loading" && (
              <motion.div
                key="loading"
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <LoadingSpinner />
              </motion.div>
            )}
            {animationState === "success" && (
              <motion.div key="success">
                <SuccessIcon />
              </motion.div>
            )}
            {animationState === "error" && (
              <motion.div key="error">
                <ErrorIcon />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <AnimatePresence mode="wait">
          {animationState === "loading" && (
            <motion.div
              key="loading-text"
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Authenticating...
              </h1>
              <p className="text-gray-600">
                Please wait while we verify your login
              </p>
            </motion.div>
          )}
          
          {animationState === "success" && (
            <motion.div
              key="success-text"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Successful Login!
              </h1>
              
              {user && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="bg-gray-50 rounded-lg p-4 mb-6"
                >
                  <p className="text-sm text-gray-600 mb-2">Welcome back!</p>
                  <div className="flex items-center justify-center space-x-3">
                    {user.profileImageUrl && (
                      <img 
                        src={user.profileImageUrl} 
                        alt="Profile" 
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    )}
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}` 
                          : user.email}
                      </p>
                      {user.email && (
                        <p className="text-sm text-gray-500">{user.email}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="text-gray-600 mb-8"
              >
                Now let's go test the AI!
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
                className="space-y-3"
              >
                <Button 
                  onClick={() => window.location.href = "/chat"}
                  className="w-full bg-[hsl(221,83%,53%)] hover:bg-[hsl(221,83%,45%)] text-white"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Test the AI
                </Button>
                
                <Button 
                  onClick={() => window.location.href = "/api/logout"}
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Logout
                </Button>
              </motion.div>
            </motion.div>
          )}
          
          {animationState === "error" && (
            <motion.div
              key="error-text"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h1 className="text-3xl font-bold text-red-600 mb-4">
                Unsuccessful Login
              </h1>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm font-semibold text-red-700 mb-1">Issue:</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
              
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="space-y-3"
              >
                <Button 
                  onClick={() => window.location.href = "/api/login"}
                  className="w-full bg-[hsl(221,83%,53%)] hover:bg-[hsl(221,83%,45%)] text-white"
                >
                  Try Again
                </Button>
                
                <Button 
                  onClick={() => window.location.href = "/"}
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Back to Home
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}