import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  Deno.env.get("FRONTEND_ORIGIN") || "https://www.chekam.com",
  "https://chekam.onrender.com",
  "http://localhost:5173",
  "http://localhost:3000",
];

const makeCorsHeaders = (origin: string | null) => {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : "*";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Credentials": "true",
  } as Record<string, string>;
};

serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: makeCorsHeaders(origin) });
  }

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

    // Service client for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "inspector"]);

    if (!roleData || roleData.length === 0) throw new Error("Insufficient permissions");

    const { inspection_id } = await req.json();
    if (!inspection_id) throw new Error("inspection_id required");

    // Fetch inspection media
    const { data: media, error: mediaErr } = await supabase
      .from("inspection_media")
      .select("*")
      .eq("inspection_id", inspection_id);

    if (mediaErr) throw mediaErr;
    if (!media || media.length === 0) throw new Error("No media found for this inspection");

    // Build descriptions of uploaded media for AI analysis
    const mediaDescriptions = media.map((m, i) => 
      `${i + 1}. ${m.media_type}: "${m.file_name}"${m.label ? ` (${m.label})` : ""}`
    ).join("\n");

    // Fetch property info
    const { data: inspection } = await supabase
      .from("inspections")
      .select("*, properties(*)")
      .eq("id", inspection_id)
      .single();

    const propertyContext = inspection?.properties
      ? `Property: ${inspection.properties.title || "Untitled"}, ${inspection.properties.address || ""} ${inspection.properties.city || ""} ${inspection.properties.state || ""}, Type: ${inspection.properties.property_type || "Unknown"}`
      : "Property details unavailable";

    // Call Lovable AI for scoring
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a professional property inspection AI analyst for the Nigerian real estate market. You evaluate properties based on uploaded inspection media (photos and videos). Score each category from 0.0 to 10.0.`
          },
          {
            role: "user",
            content: `Analyze this property inspection and provide scores.

${propertyContext}

Uploaded media:
${mediaDescriptions}

Based on the media descriptions and property context, provide realistic facility scores. Consider this is a Nigerian property inspection.`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "submit_inspection_scores",
            description: "Submit facility inspection scores for a property",
            parameters: {
              type: "object",
              properties: {
                overall_score: { type: "number", description: "Overall property score 0-10" },
                summary: { type: "string", description: "2-3 sentence summary of the property condition" },
                categories: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      category: { type: "string", enum: ["Structural Integrity", "Electrical Systems", "Plumbing", "Roofing", "Interior Finishing", "Exterior & Landscaping", "Security Features", "Road Access & Environment"] },
                      score: { type: "number", description: "Score 0-10" },
                      remarks: { type: "string", description: "Brief remark about this category" }
                    },
                    required: ["category", "score", "remarks"],
                    additionalProperties: false
                  }
                }
              },
              required: ["overall_score", "summary", "categories"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "submit_inspection_scores" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...makeCorsHeaders(req.headers.get("origin")), "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...makeCorsHeaders(req.headers.get("origin")), "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("AI did not return scores");

    const scores = JSON.parse(toolCall.function.arguments);

    // Delete old scores
    await supabase.from("inspection_scores").delete().eq("inspection_id", inspection_id);

    // Insert new scores
    const scoreRows = scores.categories.map((c: any) => ({
      inspection_id,
      category: c.category,
      score: c.score,
      remarks: c.remarks,
    }));
    const { error: insertErr } = await supabase.from("inspection_scores").insert(scoreRows);
    if (insertErr) throw insertErr;

    // Update inspection
    const { error: updateErr } = await supabase
      .from("inspections")
      .update({
        overall_score: scores.overall_score,
        ai_summary: scores.summary,
        status: "scored",
      })
      .eq("id", inspection_id);
    if (updateErr) throw updateErr;

    return new Response(JSON.stringify({ success: true, scores }), {
      headers: { ...makeCorsHeaders(req.headers.get("origin")), "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("score-inspection error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 400,
      headers: { ...makeCorsHeaders(origin), "Content-Type": "application/json" },
    });
  }
});
