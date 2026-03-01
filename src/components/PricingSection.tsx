import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Pay-Per-Case",
    price: "$29",
    period: "per case",
    description: "Perfect for one-off property checks",
    features: [
      "Single property verification",
      "Document OCR analysis",
      "AI risk scoring",
      "PDF report download",
      "Email support",
    ],
    highlighted: false,
  },
  {
    name: "Professional",
    price: "$99",
    period: "per month",
    description: "For active buyers and investors",
    features: [
      "Unlimited verifications",
      "AI Decision Assistant",
      "Virtual inspection booking",
      "Priority support",
      "Advanced fraud detection",
      "Market valuation reports",
    ],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For agencies and legal teams",
    features: [
      "Everything in Professional",
      "Team collaboration",
      "API access",
      "Custom integrations",
      "Dedicated account manager",
      "SLA guarantee",
    ],
    highlighted: false,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-24 bg-muted">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-secondary uppercase tracking-wider">
            Pricing
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mt-2">
            Simple, transparent <span className="text-primary">pricing</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
            Choose the plan that fits your needs. No hidden fees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`rounded-2xl p-8 border ${
                plan.highlighted
                  ? "bg-primary text-primary-foreground border-primary shadow-[var(--shadow-elevated)] scale-105"
                  : "bg-card text-card-foreground border-border"
              }`}
            >
              <h3 className="font-display font-semibold text-lg">{plan.name}</h3>
              <p
                className={`text-sm mt-1 ${
                  plan.highlighted ? "text-primary-foreground/70" : "text-muted-foreground"
                }`}
              >
                {plan.description}
              </p>

              <div className="mt-6 mb-6">
                <span className="text-4xl font-display font-bold">{plan.price}</span>
                {plan.period && (
                  <span
                    className={`text-sm ml-1 ${
                      plan.highlighted ? "text-primary-foreground/60" : "text-muted-foreground"
                    }`}
                  >
                    {plan.period}
                  </span>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check
                      size={16}
                      className={`mt-0.5 flex-shrink-0 ${
                        plan.highlighted ? "text-secondary" : "text-primary"
                      }`}
                    />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.highlighted ? "hero" : "outline"}
                className="w-full"
              >
                {plan.name === "Enterprise" ? "Contact Sales" : "Get Started"}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
