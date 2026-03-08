import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PaystackInitParams {
  email: string;
  amount: number; // in kobo
  planType: string;
  propertyId?: string;
  userId: string;
  publicKey: string;
  onSuccess: (reference: string) => void;
  onClose: () => void;
}

declare global {
  interface Window {
    PaystackPop: {
      setup: (config: Record<string, unknown>) => { openIframe: () => void };
    };
  }
}

export function usePaystack() {
  const [loading, setLoading] = useState(false);

  const initializePayment = useCallback(async ({
    email, amount, planType, propertyId, userId, publicKey, onSuccess, onClose,
  }: PaystackInitParams) => {
    setLoading(true);

    const reference = `chk_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    try {
      // Create payment record first
      const { error: insertErr } = await supabase.from("payments").insert({
        user_id: userId,
        property_id: propertyId || null,
        plan_type: planType,
        amount: amount / 100, // store in naira
        currency: "NGN",
        paystack_reference: reference,
        status: "pending",
      } as any);

      if (insertErr) throw insertErr;

      // Load Paystack inline script if not loaded
      if (!window.PaystackPop) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://js.paystack.co/v1/inline.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Paystack"));
          document.head.appendChild(script);
        });
      }

      const handler = window.PaystackPop.setup({
        key: publicKey,
        email,
        amount,
        currency: "NGN",
        ref: reference,
        metadata: { plan_type: planType, property_id: propertyId },
        callback: (response: { reference: string }) => {
          onSuccess(response.reference);
        },
        onClose: () => {
          setLoading(false);
          onClose();
        },
      });

      handler.openIframe();
    } catch (err: any) {
      setLoading(false);
      toast.error(err.message || "Payment initialization failed");
    }
  }, []);

  const verifyPayment = useCallback(async (reference: string) => {
    const { data, error } = await supabase.functions.invoke("paystack-verify", {
      body: { reference },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  }, []);

  return { loading, setLoading, initializePayment, verifyPayment };
}
