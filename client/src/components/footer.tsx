import { Bot } from "lucide-react";
import { FaTwitter, FaLinkedin, FaGithub ,FaYoutube, FaInstagram } from "react-icons/fa";

export default function Footer() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-[hsl(222,84%,5%)] text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-[hsl(221,83%,53%)] rounded-lg flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold">Budget Builder Agent</span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              Your financial coach in your pocket. Empowering better financial decisions through AI-powered education.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://x.com/WalletGyde"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-[hsl(221,83%,53%)] transition-colors"
                aria-label="Twitter"
              >
                <FaTwitter className="w-5 h-5" />
              </a>
              <a 
                href="https://www.linkedin.com/company/walletgyde/posts/?feedView=all"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-[hsl(221,83%,53%)] transition-colors"
                aria-label="LinkedIn"
              >
                <FaLinkedin className="w-5 h-5" />
              </a>
              <a 
                href="https://www.instagram.com/walletgyde/"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-[hsl(221,83%,53%)] transition-colors"
                aria-label="Instagram"
              >
                <FaInstagram className="w-5 h-5" />
              </a>

              <a 
                href="https://www.youtube.com/@walletgyde5634"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-[hsl(221,83%,53%)] transition-colors"
                aria-label="YouTube"
              >
                <FaYoutube className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <button 
                  onClick={() => scrollToSection("features")}
                  className="hover:text-white transition-colors"
                >
                  Features
                </button>
              </li>
              <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
          <p>&copy; 2025 Walletgyde AI. All rights reserved. Built with ❤️ for better financial futures.</p>
        </div>
      </div>
    </footer>
  );
}
