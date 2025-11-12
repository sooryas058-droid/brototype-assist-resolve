import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, description, category } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const combinedText = `${title} ${description}`;
    
    // Analyze complaint with AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an AI assistant for Brototype's complaint management system. Analyze complaints and provide:
1. Category verification/suggestion (Infrastructure, Faculty, Curriculum, Administration, Facilities, Other)
2. Priority level (Low, Medium, High) with confidence score (0-1)
3. Professional draft response for admin

Be empathetic, professional, and solution-oriented.`,
          },
          {
            role: "user",
            content: `Analyze this complaint:
Title: ${title}
Description: ${description}
Selected Category: ${category}

Provide JSON response with: suggestedCategory, priority, priorityScore, suggestedResponse`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_complaint",
              description: "Analyze a student complaint and provide categorization, priority, and response suggestion",
              parameters: {
                type: "object",
                properties: {
                  suggestedCategory: {
                    type: "string",
                    enum: ["Infrastructure", "Faculty", "Curriculum", "Administration", "Facilities", "Other"],
                  },
                  priority: {
                    type: "string",
                    enum: ["Low", "Medium", "High"],
                  },
                  priorityScore: {
                    type: "number",
                    description: "Confidence score between 0 and 1",
                  },
                  suggestedResponse: {
                    type: "string",
                    description: "Professional draft response for admin to use or edit",
                  },
                },
                required: ["suggestedCategory", "priority", "priorityScore", "suggestedResponse"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: {
          type: "function",
          function: { name: "analyze_complaint" },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service requires payment. Please contact administrator." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall || !toolCall.function?.arguments) {
      throw new Error("No valid response from AI");
    }

    const analysis = JSON.parse(toolCall.function.arguments);
    
    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-complaint function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});