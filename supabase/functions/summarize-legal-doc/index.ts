// Summarize legal documents in simple language.
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.104.1/cors";

const LANG_NAME: Record<string, string> = { en: "English", hi: "Hindi (हिन्दी)", ta: "Tamil (தமிழ்)" };
const GEMINI_MODEL = "gemini-1.5-flash";

const extractGeminiText = (data: any): string => {
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return "";
  return parts.map((p: any) => p?.text ?? "").join("");
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { text, language = "en", filename = "document" } = await req.json();
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "text required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const PRIMARY_AI_API_KEY = Deno.env.get("PRIMARY_AI_API_KEY") ?? Deno.env.get("LOVABLE_API_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    // Cap input to keep within token limits (~80k chars).
    const trimmed = text.length > 80000 ? text.slice(0, 80000) + "\n...[document truncated]" : text;
    const language_name = LANG_NAME[language] ?? "English";

    const system = `You are Nyaya Mitra, a legal explainer. Read legal documents and explain them in VERY SIMPLE ${language_name}, for users with low legal literacy.

Output STRICT format with these exact section headings (translate the headings to ${language_name}):

1. Summary in 3 lines
2. Key parties / who is involved
3. Important dates and deadlines
4. Main rights and duties (bullet points, plain words)
5. Risks or things to watch out for
6. Action steps for the reader (numbered)
7. Suggested questions to ask a lawyer

Rules:
- Use short sentences. No jargon. If you must use a legal term, define it in brackets.
- If something is unclear in the document, say so honestly — do not invent.
- This is general information, not legal advice. Add a one-line reminder at the end to consult a qualified lawyer.`;

    const userPrompt = `Document name: ${filename}\n\n---\n${trimmed}`;
    let summary = "";
    let lastPrimaryStatus: number | null = null;
    let lastPrimaryBody = "";

    if (PRIMARY_AI_API_KEY) {
      try {
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${PRIMARY_AI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: system },
              { role: "user", content: userPrompt },
            ],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          summary = data?.choices?.[0]?.message?.content ?? "";
        } else {
          lastPrimaryStatus = response.status;
          lastPrimaryBody = await response.text();
          console.error("Primary provider error", response.status, lastPrimaryBody);
        }
      } catch (err) {
        console.error("Primary provider request failed, attempting Gemini fallback", err);
      }
    }

    if (!summary && GEMINI_API_KEY) {
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: system }],
            },
            contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          }),
        },
      );

      if (geminiResponse.ok) {
        const data = await geminiResponse.json();
        summary = extractGeminiText(data);
      } else {
        const geminiError = await geminiResponse.text();
        console.error("Gemini fallback error", geminiResponse.status, geminiError);
      }
    }

    if (!summary) {
      if (lastPrimaryStatus === 429) {
        return new Response(JSON.stringify({ error: "Too many requests. Please wait a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (lastPrimaryStatus === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!PRIMARY_AI_API_KEY && !GEMINI_API_KEY) {
        throw new Error("No AI provider configured. Set PRIMARY_AI_API_KEY or GEMINI_API_KEY.");
      }
      throw new Error(`AI provider request failed${lastPrimaryBody ? `: ${lastPrimaryBody}` : ""}`);
    }

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("summarize-legal-doc error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
