// Text-to-speech via AI gateway.
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.104.1/cors";
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { text, voice = "alloy" } = await req.json();
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "text required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const PRIMARY_AI_API_KEY = Deno.env.get("PRIMARY_AI_API_KEY") ?? Deno.env.get("LOVABLE_API_KEY");
    if (!PRIMARY_AI_API_KEY) throw new Error("PRIMARY_AI_API_KEY not configured");

    // Cap text to reasonable length
    const input = text.length > 4000 ? text.slice(0, 4000) : text;

    // Use OpenAI-compatible TTS through the configured gateway
    const response = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PRIMARY_AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini-tts",
        input,
        voice,
        response_format: "mp3",
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("TTS error", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Too many requests." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "TTS failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const audioBuffer = await response.arrayBuffer();
    const audioBase64 = encodeBase64(new Uint8Array(audioBuffer));
    return new Response(JSON.stringify({ audioContent: audioBase64 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("text-to-speech error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
