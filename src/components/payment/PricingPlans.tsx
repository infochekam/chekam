import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface PlanTier {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  popular?: boolean;
}

export const PLAN_TIERS: PlanTier[] = [
  {
    id: "basic",
    name: "Basic",
    price: 5000,
    description: "Essential document verification",
    features: [
      "AI document verification",
      "OCR text extraction",
      "Authenticity assessment",
      "PDF report",
    ],
  },
  {
    id: "standard",
    name: "Standard",
    price: 15000,
    description: "Comprehensive property check",
    features: [
      "Everything in Basic",
      "Virtual property inspection",
      "AI risk scoring",
      "Neighbourhood analysis",
      "Priority support",
    ],
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: 35000,
    description: "Full due-diligence package",
    features: [
      "Everything in Standard",
      "Physical inspection coordination",
      "Legal document review",
      "Market valuation report",
      "Dedicated account manager",
    ],
  },
];

interface PricingPlansProps {
  onSelectPlan: (plan: PlanTier) => void;
  loading?: boolean;
  selectedPlanId?: string;
}

const PricingPlans = ({ onSelectPlan, loading, selectedPlanId }: PricingPlansProps) => {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {PLAN_TIERS.map((plan) => (
        <Card
          key={plan.id}
          className={`relative flex flex-col ${
            plan.popular ? "border-primary shadow-lg ring-2 ring-primary/20" : ""
          }`}
        >
          {plan.popular && (
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
              Most Popular
            </Badge>
          )}
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-lg">{plan.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{plan.description}</p>
            <div className="mt-3">
              <span className="text-3xl font-bold">₦{plan.price.toLocaleString()}</span>
              <span className="text-muted-foreground text-sm"> / property</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <ul className="space-y-2.5 flex-1 mb-6">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button
              className="w-full"
              variant={plan.popular ? "default" : "outline"}
              onClick={() => onSelectPlan(plan)}
              disabled={loading && selectedPlanId === plan.id}
            >
              {loading && selectedPlanId === plan.id ? "Processing…" : "Select Plan"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PricingPlans;
