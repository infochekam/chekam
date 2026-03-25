/**
 * Centralized pricing configuration
 * Used across home page and payment flows to ensure consistency
 */

export interface PricingPlan {
  id: string;
  name: string;
  price: number; // in USD for home page, in NGN (₦) for payment
  currency: "USD" | "NGN";
  period?: string; // "per month", "per case", etc.
  description: string;
  features: string[];
  highlighted?: boolean;
  popular?: boolean;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "pay-per-case",
    name: "Pay-Per-Case",
    price: 29,
    currency: "USD",
    period: "per case",
    description: "Perfect for one-off property checks",
    features: [
      "Single property verification",
      "Document analysis & OCR",
      "Video walkthrough",
      "AI risk scoring & report",
      "Email support",
    ],
    highlighted: false,
  },
  {
    id: "professional",
    name: "Professional",
    price: 99,
    currency: "USD",
    period: "per month",
    description: "For active buyers and investors",
    features: [
      "Unlimited verifications",
      "AI Decision Assistant",
      "Video + 3D virtual tours",
      "AI-powered scoring",
      "Priority support",
      "Advanced fraud detection",
    ],
    highlighted: true,
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 0, // Custom pricing
    currency: "USD",
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

/**
 * Payment-specific pricing (in NGN for Paystack)
 * Maps to the original USD prices with appropriate conversion
 * USD $29 ≈ ₦15,000
 * USD $99 ≈ ₦50,000
 * (Using current exchange rate approximations)
 */
export const PAYMENT_PLAN_TIERS: PricingPlan[] = [
  {
    id: "pay-per-case",
    name: "Pay-Per-Case",
    price: 15000,
    currency: "NGN",
    period: "per property",
    description: "Essential property verification",
    features: [
      "Single property verification",
      "Document analysis & OCR",
      "Video walkthrough",
      "AI risk scoring & report",
      "Email support",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    price: 50000,
    currency: "NGN",
    period: "per month",
    description: "Comprehensive verification package",
    features: [
      "Unlimited verifications",
      "AI Decision Assistant",
      "Video + 3D virtual tours",
      "AI-powered scoring",
      "Priority support",
      "Advanced fraud detection",
    ],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 0,
    currency: "NGN",
    description: "Custom enterprise solutions",
    features: [
      "Everything in Professional",
      "Team collaboration",
      "API access",
      "Custom integrations",
      "Dedicated account manager",
      "SLA guarantee",
    ],
  },
];
