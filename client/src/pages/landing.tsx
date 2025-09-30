import { useState } from "react";
import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import BudgetBuilderSection from "@/components/budget-builder-section";
import CommunityImpact from "@/components/community-impact";
import SponsorsPartners from "@/components/sponsors-partners";
import CTASection from "@/components/cta-section";
import Footer from "@/components/footer";
import EmailPopup from "@/components/EmailPopup";




export default function LandingPage() {
  const [showEmailPopup, setShowEmailPopup] = useState(false);

  const scrollToCTA = () => {
    const element = document.querySelector('.cta-section');
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSeeDemo = () => {
    setShowEmailPopup(true);
  };

  const handleEmailSubmit = (email: string) => {
    // Store email in sessionStorage for demo purposes
    sessionStorage.setItem('demoUserEmail', email);
    setShowEmailPopup(false);
    // Redirect to chatbot
    window.location.href = "/chatbot";
  };

  const handleClosePopup = () => {
    setShowEmailPopup(false);
  };

  return (
    <div className="min-h-screen bg-[hsl(210,40%,98%)]">
      <Navigation onSeeDemo={handleSeeDemo} />
      
      <HeroSection onJoinBeta={scrollToCTA} onSeeDemo={handleSeeDemo} />
      
      <BudgetBuilderSection />
      <CommunityImpact />
      <SponsorsPartners />
      <div className="cta-section">
        <CTASection />
      </div>
      <Footer />
      
      <EmailPopup 
        isOpen={showEmailPopup}
        onClose={handleClosePopup}
        onEmailSubmit={handleEmailSubmit}
      />
    </div>
  );
}
