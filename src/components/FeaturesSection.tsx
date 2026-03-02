import { motion } from "framer-motion";
import {
  FileSearch,
  Bot,
  Video,
  FileText,
  ShieldCheck,
  Link,
  Camera,
  Box,
  BarChart3,
} from "lucide-react";

const features = [
  {
    icon: Link,
    title: "Multi-Channel Submission",
    description:
      "Submit properties via document upload, listing URL, or manual entry—whatever's easiest for you.",
  },
  {
    icon: FileSearch,
    title: "Document Verification",
    description:
      "OCR-powered analysis detects forged documents, ownership inconsistencies, and alteration patterns automatically.",
  },
  {
    icon: Video,
    title: "Video Walkthrough",
    description:
      "Our inspectors visit the property and record professional video walkthroughs so you can see every corner remotely.",
  },
  {
    icon: Box,
    title: "Interactive 3D Tours",
    description:
      "Get immersive 3D models of inspected properties. Explore rooms, measure spaces, and assess conditions virtually.",
  },
  {
    icon: BarChart3,
    title: "AI-Powered Scoring",
    description:
      "AI analyzes inspection photos, videos, and documents to auto-generate structural, legal, and market scores.",
  },
  {
    icon: Bot,
    title: "AI Decision Assistant",
    description:
      "Chat with our AI to interpret documents, understand risks, get valuations, and receive investment recommendations.",
  },
  {
    icon: ShieldCheck,
    title: "Fraud Detection",
    description:
      "AI-driven pattern recognition flags suspicious listings, duplicate documents, and signature anomalies.",
  },
  {
    icon: FileText,
    title: "Smart Reports",
    description:
      "Get comprehensive PDF reports with Legal Risk Index, Structural Score, Market Fairness, and Investment Rating.",
  },
  {
    icon: Camera,
    title: "Photo Gallery & Evidence",
    description:
      "All inspection photos organized by room and category, with annotations highlighting key findings.",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-secondary uppercase tracking-wider">
            Features
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mt-2">
            Verify, inspect & decide—
            <span className="text-primary">all in one place</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            From document verification to 3D virtual tours and AI scoring,
            Chekam covers every step of property due diligence.
          </p>
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={item}
              className="group relative bg-card rounded-xl p-6 border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-[var(--shadow-elevated)]"
            >
              <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <feature.icon size={24} />
              </div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
