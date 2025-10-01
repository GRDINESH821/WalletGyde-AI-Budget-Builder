import { motion } from "framer-motion";
import { Building2, Shield, Users, Heart } from "lucide-react";

const partners = [
  {
    name: "Alpine Bank",
    logo: "/logos/alpine_bank.png",
    description: "Community banking partner"
  },
  {
    name: "On Tap Credit Union", 
    logo: "/logos/on_tap.png",
    description: "Credit union collaborator"
  },
  {
    name: "TBK Bank",
    logo: "/logos/colorado_enterprise_fund.png",
    description: "Community Lending Partner"
  },
  {
    name: "Empowering Community Entrepreneurs",
    logo: "/logos/ECE.png",
    description: "Financial education advocate"
  }
];

export default function SponsorsPartners() {
  return (
    <section className="py-20 bg-gradient-to-br from-[hsl(210,40%,98%)] to-[hsl(221,83%,53%)]/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[hsl(222,47%,11%)] mb-6">
            Supported by Leading Financial Institutions
          </h2>
          <p className="text-xl text-[hsl(215,16%,47%)] max-w-3xl mx-auto">
            These partners share our mission to make financial coaching accessible to all.
          </p>
        </motion.div>

        {/* Logo Strip */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12"
        >
          {partners.map((partner, index) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col items-center justify-center min-h-[100px]"
            >
               <div className="w-full h-20 rounded-lg flex items-center justify-center mb-2 overflow-hidden bg-gray-50" style={{width: '90%'}}>
                 <img 
                   src={partner.logo} 
                   alt={`${partner.name} logo`}
                   className="w-full h-full object-contain"
                   onError={(e) => {
                     console.log('Image failed to load:', partner.logo);
                     // If image fails to load, show placeholder
                     e.currentTarget.style.display = 'none';
                     const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                     if (placeholder) placeholder.style.display = 'flex';
                   }}
                   onLoad={() => {
                     console.log('Image loaded successfully:', partner.logo);
                   }}
                 />
                 <div className="w-full h-full bg-gradient-to-br from-[hsl(221,83%,53%)] to-[hsl(158,64%,52%)] rounded-lg flex items-center justify-center" style={{display: 'none'}}>
                   <Building2 className="w-12 h-12 text-white" />
                 </div>
               </div>
              <h3 className="text-xs font-semibold text-[hsl(222,47%,11%)] text-center">
                {partner.name}
              </h3>
              <p className="text-xs text-[hsl(215,16%,47%)] text-center mt-1 leading-tight">
                {partner.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-[hsl(221,83%,53%)] rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-[hsl(222,47%,11%)] mb-2">
              Secure & Trusted
            </h3>
            <p className="text-[hsl(215,16%,47%)] text-sm">
              Bank-level security with partner verification
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-[hsl(158,64%,52%)] rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-[hsl(222,47%,11%)] mb-2">
              Community Focused
            </h3>
            <p className="text-[hsl(215,16%,47%)] text-sm">
              Local partnerships for accessible financial education
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-[hsl(43,89%,38%)] rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-[hsl(222,47%,11%)] mb-2">
              Mission Driven
            </h3>
            <p className="text-[hsl(215,16%,47%)] text-sm">
              Committed to financial literacy for everyone
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
