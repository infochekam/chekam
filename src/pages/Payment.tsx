import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import PricingPlans, { PlanTier } from "@/components/payment/PricingPlans";
import { usePaystack } from "@/hooks/usePaystack";
import logo from "@/assets/chekamlogo.png";

const Payment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const propertyId = searchParams.get("propertyId") || undefined;
  const [selectedPlanId, setSelectedPlanId] = useState<string>();
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [paystackKey, setPaystackKey] = useState<string>("");
  const { loading, setLoading, initializePayment, verifyPayment } = usePaystack();

  useEffect(() => {
    supabase.functions.invoke("paystack-config").then(({ data }) => {
      if (data?.publicKey) setPaystackKey(data.publicKey);
    });
  }, []);

  const handleSelectPlan = async (plan: PlanTier) => {
    if (!user?.email) {
      toast.error("Please log in to continue");
      return;
    }
    if (!paystackKey) {
      toast.error("Payment is not configured. Please contact support.");
      return;
    }

    setSelectedPlanId(plan.id);

    await initializePayment({
      email: user.email,
      amount: plan.price * 100, // convert to kobo
      planType: plan.id,
      propertyId,
      userId: user.id,
      publicKey: PAYSTACK_PUBLIC_KEY,
      onSuccess: async (reference) => {
        try {
          await verifyPayment(reference);
          setPaymentComplete(true);
          toast.success("Payment verified successfully!");
        } catch {
          toast.error("Payment verification failed. Please contact support.");
        } finally {
          setLoading(false);
        }
      },
      onClose: () => {
        toast.info("Payment cancelled");
        setSelectedPlanId(undefined);
      },
    });
  };

  if (paymentComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <CheckCircle className="h-16 w-16 text-primary mx-auto" />
          <h1 className="text-2xl font-display font-bold">Payment Successful!</h1>
          <p className="text-muted-foreground">
            Your verification service has been activated. We'll begin processing your property shortly.
          </p>
          <div className="flex gap-3 justify-center pt-4">
            <Button asChild>
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
            {propertyId && (
              <Button variant="outline" asChild>
                <Link to={`/property/${propertyId}/documents`}>View Documents</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center gap-4 h-16 px-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <img src={logo} alt="Chekam" className="h-7" />
          <h1 className="text-lg font-display font-bold">Choose a Plan</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-display font-bold">Property Verification Plans</h2>
          <p className="text-muted-foreground mt-2">Select a plan to verify your property and protect your investment</p>
        </div>
        <PricingPlans
          onSelectPlan={handleSelectPlan}
          loading={loading}
          selectedPlanId={selectedPlanId}
        />
      </main>
    </div>
  );
};

export default Payment;
