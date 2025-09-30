import { motion } from "framer-motion";
import { Users, Calendar, MapPin } from "lucide-react";

const events = [
  {
    id: 1,
    title: "Budget Workshop — Alpine Bank",
    date: "Jan 2025",
    location: "Alpine Bank",
    image: "/workshops/alpine_workshop.png", // Add your image here
    description: "Financial education workshop for Alpine Bank customers"
  },
  {
    id: 2,
    title: "On Tap Credit Union Workshop",
    date: "Mar 2025", 
    location: "On Tap Credit Union",
    image: "/workshops/ontap_workshop.png", // Add your image here
    description: "Community financial literacy session"
  },
  {
    id: 3,
    title: "Denver Startup Week Panel",
    date: "Sep 2025",
    location: "Denver Startup Week",
    image: "/workshops/denver_startup.png", // Add your image here
    description: "Panel discussion on financial technology and accessibility"
  }
];

export default function CommunityImpact() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[hsl(222,47%,11%)] mb-6">
            Trusted by the Community
          </h2>
          <p className="text-xl text-[hsl(215,16%,47%)] max-w-3xl mx-auto">
            We're not just AI. Walletgyde is active in communities, delivering real financial education.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div className="relative h-48 overflow-hidden">
                {event.image.includes('/workshops/') ? (
                  <img 
                    src={event.image} 
                    alt={`${event.title} workshop`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[hsl(221,83%,53%)] to-[hsl(158,64%,52%)] flex items-center justify-center">
                    <div className="text-center text-white">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-80" />
                      <p className="text-sm opacity-90">Workshop Image</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-6">
                <h3 className="text-lg font-semibold text-[hsl(222,47%,11%)] mb-2">
                  {event.title}
                </h3>
                
                <div className="flex items-center text-sm text-[hsl(215,16%,47%)] mb-2">
                  <Calendar className="w-4 h-4 mr-2" />
                  {event.date}
                </div>
                
                <div className="flex items-center text-sm text-[hsl(215,16%,47%)] mb-3">
                  <MapPin className="w-4 h-4 mr-2" />
                  {event.location}
                </div>
                
                <p className="text-sm text-[hsl(215,16%,47%)]">
                  {event.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
