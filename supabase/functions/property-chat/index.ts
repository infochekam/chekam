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
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { messages, property_id } = await req.json();
    if (!messages || !Array.isArray(messages)) throw new Error("messages array required");

    // Build property context
    let propertyContext = "";

    if (property_id) {
      // Fetch property details
      const { data: property } = await supabase
        .from("properties")
        .select("*")
        .eq("id", property_id)
        .single();

      if (property) {
        propertyContext += `\n\nProperty: "${property.title}"
Status: ${property.status}
Submission Method: ${property.submission_method}
Address: ${property.address || "N/A"}, ${property.city || ""} ${property.state || ""}
Type: ${property.property_type || "N/A"}
Description: ${property.description || "N/A"}`;

        // Fetch documents with verification results
        const { data: docs } = await supabase
          .from("property_documents")
          .select("*")
          .eq("property_id", property_id);

        if (docs && docs.length > 0) {
          propertyContext += "\n\nDocuments:";
          for (const doc of docs) {
            propertyContext += `\n- ${doc.file_name} (${doc.document_type || "Unknown type"}) — Status: ${doc.verification_status}`;
            if (doc.verification_result) {
              const r = doc.verification_result as any;
              propertyContext += `\n  Authentic: ${r.is_authentic}, Confidence: ${r.confidence_score}%`;
              propertyContext += `\n  Summary: ${r.summary}`;
              if (r.key_details) {
                if (r.key_details.names?.length) propertyContext += `\n  Names: ${r.key_details.names.join(", ")}`;
                if (r.key_details.dates?.length) propertyContext += `\n  Dates: ${r.key_details.dates.join(", ")}`;
                if (r.key_details.registration_numbers?.length) propertyContext += `\n  Reg Numbers: ${r.key_details.registration_numbers.join(", ")}`;
                if (r.key_details.issuing_authority) propertyContext += `\n  Issuing Authority: ${r.key_details.issuing_authority}`;
              }
              if (r.red_flags?.length) propertyContext += `\n  ⚠ Red Flags: ${r.red_flags.join("; ")}`;
              propertyContext += `\n  OCR Text: ${r.extracted_text_summary}`;
            }
          }
        }

        // Fetch inspections
        const { data: inspections } = await supabase
          .from("inspections")
          .select("*, inspection_scores(*)")
          .eq("property_id", property_id);

        if (inspections && inspections.length > 0) {
          for (const insp of inspections) {
            propertyContext += `\n\nInspection (${insp.status}):`;
            if (insp.overall_score) propertyContext += ` Overall Score: ${insp.overall_score}/10`;
            if (insp.ai_summary) propertyContext += `\n  Summary: ${insp.ai_summary}`;
            if (insp.inspection_scores?.length) {
              for (const s of insp.inspection_scores) {
                propertyContext += `\n  - ${s.category}: ${s.score}/10 — ${s.remarks || ""}`;
              }
            }
          }
        }
      }
    } else {
      // Fetch all user properties for general context
      const { data: properties } = await supabase
        .from("properties")
        .select("id, title, status, submission_method")
        .eq("user_id", user.id)
        .limit(20);

      if (properties && properties.length > 0) {
        propertyContext += "\n\nUser's properties:";
        for (const p of properties) {
          propertyContext += `\n- "${p.title}" (${p.status}, via ${p.submission_method})`;
        }
      }
    }

    const systemPrompt = `You are Chekam AI, a friendly and knowledgeable Nigerian real estate verification assistant. You help users understand their property verification results, document OCR analysis, inspection scores, and any red flags.

Key guidelines:
- Explain verification results in simple, clear language
- Highlight any concerns or red flags and explain what they mean
- Provide actionable advice on next steps
- Be familiar with Nigerian property documents (Title Deeds, C of O, Survey Plans, etc.)
- If a document is flagged, explain possible reasons and suggest how to resolve issues
- Be conversational and supportive — many users are first-time property buyers
- Use markdown formatting for clarity (headers, bold, lists)
- If asked about a specific property, refer to the context data below
- If no property context is available, ask which property they'd like to discuss
${propertyContext}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("property-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
