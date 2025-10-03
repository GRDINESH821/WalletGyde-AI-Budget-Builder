import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import RobotIcon from "@/components/RobotIcon";

interface NavigationProps {
  onSeeDemo: () => void;
}

export default function Navigation({ onSeeDemo }: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/90 backdrop-blur-lg border-b border-gray-200"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                <RobotIcon className="w-8 h-8" size="sm" useCustomIcon={true} customIconPath="/logos/BudgetBuilder_square.png" />
            </div>
            <span className="text-xl font-bold text-[hsl(222,47%,11%)]">
              Budget Builder Agent
            </span>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <Button
              onClick={onSeeDemo}
              className="bg-[hsl(221,83%,53%)] text-white hover:bg-[hsl(221,83%,45%)] transition-colors text-sm sm:text-base px-3 sm:px-4"
            >
              See Demo
            </Button>

            <button
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>


      </div>
    </nav>
  );
}
