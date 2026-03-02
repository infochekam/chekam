import { motion } from "framer-motion";
import { Upload, ScanSearch, Video, BarChart3, Bot } from "lucide-react";

const steps = [
  {
    icon: Upload,
    step: "01",
    title: "Submit Property",
    description:
      "Upload documents, paste a listing link, or enter property details manually to create a case.",
  },
  {
    icon: ScanSearch,
    step: "02",
    title: "AI Document Check",
    description:
      "Our AI scans documents for forgery, cross-checks ownership records, and flags inconsistencies instantly.",
  },
  {
    icon: Video,
    step: "03",
    title: "Virtual Inspection",
    description:
      "Our team visits the property, records video walkthroughs, captures photos, and creates an interactive 3D tour.",
  },
  {
    icon: BarChart3,
    step: "04",
    title: "AI Scoring & Report",
    description:
      "AI analyzes all media and documents to generate structural, legal, and market scores—delivered as a PDF report.",
  },
  {
    icon: Bot,
    step: "05",
    title: "AI Decision Assistant",
    description:
      "Chat with our AI to clarify findings, compare properties, and get personalized investment recommendations.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 bg-muted">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-secondary uppercase tracking-wider">
            How It Works
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mt-2">
            Five steps to a <span className="text-primary">confident</span> decision
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="relative text-center"
            >
              <div className="mx-auto w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mb-4 shadow-lg">
                <s.icon size={28} />
              </div>

              <span className="font-display text-4xl font-bold text-primary/10">
                {s.step}
              </span>

              <h3 className="font-display font-semibold text-lg text-foreground mt-1 mb-2">
                {s.title}
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                {s.description}
              </p>

              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px bg-border" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
