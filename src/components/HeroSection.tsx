import { motion } from "framer-motion";
import { ArrowRight, Shield, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={heroBg}
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-primary/60" />
      </div>

      <div className="container mx-auto px-4 relative z-10 pt-20">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 bg-secondary/20 text-secondary rounded-full px-4 py-1.5 text-sm font-medium mb-6 backdrop-blur-sm border border-secondary/30">
              <Shield size={14} />
              AI-Powered Property Verification
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-primary-foreground leading-tight mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            Buy Property with{" "}
            <span className="text-secondary">Confidence</span>, from Anywhere
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-lg"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Chekam uses AI to verify documents, detect fraud, and score risk—so
            you can make informed property decisions remotely.
          </motion.p>

          <motion.div
            className="flex flex-wrap gap-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
          >
            <Button variant="hero" size="lg" className="gap-2">
              Start Verification <ArrowRight size={18} />
            </Button>
            <Button variant="hero-outline" size="lg" className="gap-2">
              <Play size={16} /> Watch Demo
            </Button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            className="mt-12 flex items-center gap-8 text-primary-foreground/60 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              500+ Properties Verified
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              98% Fraud Detection
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
