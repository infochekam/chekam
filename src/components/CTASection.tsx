import { motion } from "framer-motion";
import { ArrowRight, Globe, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const CTASection = () => {
  return (
    <section id="contact" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          className="relative rounded-3xl overflow-hidden bg-primary p-12 md:p-20 text-center"
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-display font-bold text-primary-foreground mb-4">
              Ready to inspect your next property?
            </h2>
            <p className="text-primary-foreground/70 text-lg max-w-xl mx-auto mb-8">
              Join hundreds of buyers and investors who trust Chekam for
              AI-powered verification, virtual inspections, and smart decision-making.
            </p>

            <Button variant="hero" size="lg" className="gap-2">
              Get Started Free <ArrowRight size={18} />
            </Button>

            <div className="mt-12 flex flex-wrap justify-center gap-8 text-primary-foreground/60 text-sm">
              <div className="flex items-center gap-2">
                <Globe size={16} />
                Works Globally
              </div>
              <div className="flex items-center gap-2">
                <Shield size={16} />
                Bank-Level Security
              </div>
              <div className="flex items-center gap-2">
                <Users size={16} />
                Trusted by 500+ Users
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
