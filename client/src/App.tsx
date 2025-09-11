import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LandingPage from "@/pages/landing";
import SuccessPage from "@/pages/success";
import AvatarSetupPage from "@/pages/avatar-setup";
import ChatbotPage from "@/pages/chatbot";
import DemoChatbotPage from "@/pages/demo-chatbot";
import SettingsPage from "@/pages/settings";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/useAuth";

function Router() {
  // COMMENTED OUT FOR DEMO (can be restored later)
  // const { user, isAuthenticated, isLoading } = useAuth();
  
  // Demo mode: All routes accessible without authentication
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/chatbot" component={DemoChatbotPage} />
      <Route path="/chat" component={DemoChatbotPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/success" component={SuccessPage} />
      <Route path="/landing" component={LandingPage} />
      <Route path="/avatar-setup" component={AvatarSetupPage} />
      <Route path="/full-chatbot" component={ChatbotPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
