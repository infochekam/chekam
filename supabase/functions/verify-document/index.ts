import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

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

    // Auth check
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { document_id } = await req.json();
    if (!document_id) throw new Error("document_id required");

    // Fetch document record
    const { data: doc, error: docErr } = await supabase
      .from("property_documents")
      .select("*, properties(title, address, city, state, property_type)")
      .eq("id", document_id)
      .single();

    if (docErr || !doc) throw new Error("Document not found");

    // Verify ownership or admin role
    const isOwner = doc.user_id === user.id;
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin"]);
    const isAdmin = roleData && roleData.length > 0;

    if (!isOwner && !isAdmin) throw new Error("Insufficient permissions");

    // Update status to processing
    await supabase
      .from("property_documents")
      .update({ verification_status: "processing" })
      .eq("id", document_id);

    // Download file from storage
    const { data: fileData, error: dlErr } = await supabase.storage
      .from("property-documents")
      .download(doc.file_path);

    if (dlErr || !fileData) throw new Error("Failed to download document");

    const fileBytes = new Uint8Array(await fileData.arrayBuffer());
    const fileBase64 = base64Encode(fileBytes);

    // Determine mime type
    const ext = doc.file_name?.split(".").pop()?.toLowerCase() || "";
    const mimeMap: Record<string, string> = {
      pdf: "application/pdf",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
    };
    const mimeType = doc.file_type || mimeMap[ext] || "application/octet-stream";

    const propertyContext = doc.properties
      ? `Property: ${doc.properties.title || "Untitled"}, ${doc.properties.address || ""} ${doc.properties.city || ""} ${doc.properties.state || ""}, Type: ${doc.properties.property_type || "Unknown"}`
      : "Property details unavailable";

    // Build multimodal message for AI
    const userContent: any[] = [
      {
        type: "text",
        text: `You are a Nigerian real estate document verification expert. Analyze this uploaded property document using OCR.

Document type claimed: ${doc.document_type || "Unknown"}
${propertyContext}

Extract all text via OCR, then verify:
1. Is this a legitimate ${doc.document_type || "property"} document?
2. Are there signs of tampering or forgery?
3. What key information can be extracted (names, dates, plot numbers, registration numbers)?
4. Does the document appear authentic for the Nigerian real estate context?
5. Any red flags or concerns?`,
      },
      {
        type: "image_url",
        image_url: { url: `data:${mimeType};base64,${fileBase64}` },
      },
    ];

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a document verification AI specializing in Nigerian real estate documents. You perform OCR and authenticity analysis.",
          },
          { role: "user", content: userContent },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_verification",
              description: "Submit document verification results",
              parameters: {
                type: "object",
                properties: {
                  is_authentic: { type: "boolean", description: "Whether the document appears authentic" },
                  confidence_score: { type: "number", description: "Confidence 0-100 in authenticity assessment" },
                  document_type_match: { type: "boolean", description: "Whether document matches claimed type" },
                  extracted_text_summary: { type: "string", description: "Key text extracted via OCR (names, dates, numbers)" },
                  key_details: {
                    type: "object",
                    properties: {
                      names: { type: "array", items: { type: "string" }, description: "Names found in document" },
                      dates: { type: "array", items: { type: "string" }, description: "Dates found" },
                      registration_numbers: { type: "array", items: { type: "string" }, description: "Registration/plot numbers" },
                      issuing_authority: { type: "string", description: "Issuing authority if found" },
                    },
                    required: ["names", "dates", "registration_numbers", "issuing_authority"],
                    additionalProperties: false,
                  },
                  red_flags: { type: "array", items: { type: "string" }, description: "Any concerns or red flags" },
                  summary: { type: "string", description: "2-3 sentence verification summary" },
                },
                required: ["is_authentic", "confidence_score", "document_type_match", "extracted_text_summary", "key_details", "red_flags", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_verification" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      // Reset status on failure
      await supabase
        .from("property_documents")
        .update({ verification_status: "pending" })
        .eq("id", document_id);

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

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      await supabase
        .from("property_documents")
        .update({ verification_status: "failed" })
        .eq("id", document_id);
      throw new Error("AI did not return verification results");
    }

    const result = JSON.parse(toolCall.function.arguments);

    const verificationStatus = result.is_authentic && result.confidence_score >= 60 ? "verified" : "flagged";

    await supabase
      .from("property_documents")
      .update({
        verification_status: verificationStatus,
        verification_result: result,
        verified_at: new Date().toISOString(),
      })
      .eq("id", document_id);

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("verify-document error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
