// Legal chat for multilingual, simplified legal guidance.
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.104.1/cors";
import { LEGAL_KNOWLEDGE_DATASET } from "../utils/legalKnowledge.ts";
import { retrieveRelevantContext } from "../utils/retrieve.ts";

const LANG_NAME: Record<string, string> = {
  en: "English",
  hi: "Hindi (हिन्दी)",
  ta: "Tamil (தமிழ்)",
};

const buildMasterPrompt = (selectedLanguage: string, userQuery: string, retrievedContext: string) => `You are NyayaMitra, a multilingual legal assistant for Indian users.

Your role:
- Explain legal topics in very simple, everyday language
- Do NOT give final legal advice or claim authority
- Help users understand options and next steps

Context (retrieved from legal dataset):
${retrievedContext}

User question:
${userQuery}

Instructions:
1. Give a clear and simple explanation
2. Provide step-by-step actions (if applicable)
3. Mention important notes or warnings
4. Avoid assumptions if information is missing
5. If unsure, say "This may vary depending on the situation"
6. If no relevant context is available, answer based on general legal knowledge and clearly state that the response is general guidance.

Output format:

### Simple Explanation
...

### What You Can Do
...

### Important Notes
...

### Example (if helpful)
...

Important:
- Do NOT generate fake laws or sections
- Do NOT cite specific legal sections unless certain
- Prefer general guidance over exact legal claims

Language:
Respond strictly in ${selectedLanguage}`;

const getLatestUserQuery = (messages: ChatMessage[]): string => {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") {
      return messages[i].content ?? "";
    }
  }
  return "";
};

const buildRetrievedContext = (query: string): string => {
  const matches = retrieveRelevantContext(query, LEGAL_KNOWLEDGE_DATASET, 3);
  if (matches.length === 0) {
    return "No relevant context found in dataset.";
  }
  return matches.map((c, i) => `Case ${i + 1}: ${c.response}`).join("\n\n");
};

const GEMINI_MODEL = "gemini-1.5-flash";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

const toGeminiContents = (messages: ChatMessage[]) =>
  messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

const extractGeminiText = (data: any): string => {
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return "";
  return parts.map((p: any) => p?.text ?? "").join("");
};

const toOpenAiDeltaSse = (fullText: string): ReadableStream<Uint8Array> => {
  const encoder = new TextEncoder();
  const chunkSize = 140;

  return new ReadableStream({
    start(controller) {
      for (let i = 0; i < fullText.length; i += chunkSize) {
        const delta = fullText.slice(i, i + chunkSize);
        const payload = `data: ${JSON.stringify({ choices: [{ delta: { content: delta } }] })}\n\n`;
        controller.enqueue(encoder.encode(payload));
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { messages, language = "en" } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const PRIMARY_AI_API_KEY = Deno.env.get("PRIMARY_AI_API_KEY") ?? Deno.env.get("LOVABLE_API_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const userQuery = getLatestUserQuery(messages as ChatMessage[]);
    const retrievedContext = buildRetrievedContext(userQuery);
    const selectedLanguage = LANG_NAME[language] ?? "English";
    const systemPrompt = buildMasterPrompt(selectedLanguage, userQuery, retrievedContext);
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
            stream: true,
            messages: [
              { role: "system", content: systemPrompt },
              ...messages,
            ],
          }),
        });

        if (response.ok && response.body) {
          return new Response(response.body, {
            headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
          });
        }

        lastPrimaryStatus = response.status;
        lastPrimaryBody = await response.text();
        console.error("Primary provider error", response.status, lastPrimaryBody);
      } catch (err) {
        console.error("Primary provider request failed, attempting Gemini fallback", err);
      }
    }

    if (GEMINI_API_KEY) {
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemPrompt }],
            },
            contents: toGeminiContents(messages as ChatMessage[]),
          }),
        },
      );

      if (geminiResponse.ok) {
        const geminiData = await geminiResponse.json();
        const text = extractGeminiText(geminiData);
        if (!text) {
          throw new Error("Gemini returned empty content");
        }
        return new Response(toOpenAiDeltaSse(text), {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
        });
      }

      const geminiError = await geminiResponse.text();
      console.error("Gemini fallback error", geminiResponse.status, geminiError);
    }

    if (lastPrimaryStatus === 429) {
      return new Response(JSON.stringify({ error: "Too many requests. Please wait a moment and try again." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (lastPrimaryStatus === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Please try again later." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!PRIMARY_AI_API_KEY && !GEMINI_API_KEY) {
      throw new Error("No AI provider configured. Set PRIMARY_AI_API_KEY or GEMINI_API_KEY.");
    }
    throw new Error(`AI provider request failed${lastPrimaryBody ? `: ${lastPrimaryBody}` : ""}`);
  } catch (e) {
    console.error("legal-chat error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
