import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const paystackSecret = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecret) throw new Error("PAYSTACK_SECRET_KEY not configured");

    // Auth check
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { reference } = await req.json();
    if (!reference) throw new Error("reference required");

    // Verify with Paystack API
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${paystackSecret}` },
    });

    if (!paystackRes.ok) {
      const errText = await paystackRes.text();
      throw new Error(`Paystack verification failed: ${errText}`);
    }

    const paystackData = await paystackRes.json();
    const txn = paystackData.data;

    if (txn.status !== "success") {
      await supabase
        .from("payments")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("paystack_reference", reference)
        .eq("user_id", user.id);

      return new Response(JSON.stringify({ success: false, message: "Payment not successful" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update payment record
    const { data: payment, error: updateErr } = await supabase
      .from("payments")
      .update({
        status: "success",
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: { paystack_response: txn },
      })
      .eq("paystack_reference", reference)
      .eq("user_id", user.id)
      .select("property_id, plan_type")
      .single();

    if (updateErr) throw new Error("Failed to update payment: " + updateErr.message);

    // If linked to a property, update its status
    if (payment?.property_id) {
      await supabase
        .from("properties")
        .update({ status: "submitted", updated_at: new Date().toISOString() })
        .eq("id", payment.property_id);
    }

    return new Response(JSON.stringify({ success: true, plan: payment?.plan_type }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("paystack-verify error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
