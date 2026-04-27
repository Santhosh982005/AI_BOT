# Supabase Backend Guide (Nyaya Mitra)

This document explains the complete Supabase backend setup used by Nyaya Mitra:

- Project configuration
- Frontend connection details
- Edge Functions and request/response contracts
- Environment variables and secrets
- Deployment and troubleshooting
- Security and reliability notes

## 1) Supabase Project Details

Project metadata is configured in:

- `supabase/config.toml`

Current settings:

- `project_id = "ooawknpqnwafhkufreyz"`
- Function configs:
  - `[functions.legal-chat] verify_jwt = false`
  - `[functions.summarize-legal-doc] verify_jwt = false`
  - `[functions.text-to-speech] verify_jwt = false`

## 2) Frontend to Supabase Connection

Frontend Supabase client is created in:

- `src/integrations/supabase/client.ts`

It reads:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

And initializes:

- `createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: ... })`

### Required frontend `.env` keys

Defined in root `.env`:

- `VITE_SUPABASE_PROJECT_ID`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL`

## 3) Supabase Edge Functions Overview

All backend logic is implemented through Supabase Edge Functions under:

- `supabase/functions/`

### 3.1 `legal-chat`

Path:

- `supabase/functions/legal-chat/index.ts`

Purpose:

- Receives chat messages and language from frontend
- Applies retrieval grounding from legal dataset
- Builds structured legal-response prompt
- Calls primary AI provider and falls back to Gemini
- Streams response to frontend using SSE

Request shape:

```json
{
  "messages": [
    { "role": "user", "content": "..." }
  ],
  "language": "en"
}
```

Success response:

- `Content-Type: text/event-stream`
- SSE lines in OpenAI-style delta format, ending with `[DONE]`

Error responses:

- `400` invalid payload
- `429` rate limit
- `402` credits exhausted
- `500` provider/internal error

Dependencies used by this function:

- `supabase/functions/utils/legalKnowledge.ts`
- `supabase/functions/utils/retrieve.ts`

### 3.2 `summarize-legal-doc`

Path:

- `supabase/functions/summarize-legal-doc/index.ts`

Purpose:

- Receives extracted PDF text
- Generates simplified legal summary in selected language
- Uses primary provider, then Gemini fallback if needed

Request shape:

```json
{
  "text": "full extracted document text",
  "language": "en",
  "filename": "sample.pdf"
}
```

Success response:

```json
{
  "summary": "..."
}
```

Important limit:

- Input text is truncated to about `80,000` characters.

### 3.3 `text-to-speech`

Path:

- `supabase/functions/text-to-speech/index.ts`

Purpose:

- Converts assistant response text into MP3 audio (base64)

Request shape:

```json
{
  "text": "Text to convert",
  "voice": "alloy"
}
```

Success response:

```json
{
  "audioContent": "<base64-mp3>"
}
```

Important limit:

- Input text is capped at `4,000` characters.

## 4) Retrieval Layer Files (Chat Grounding)

### `supabase/functions/utils/legalKnowledge.ts`

- Contains domain legal Q&A dataset entries (`topic`, `prompt`, `response`, `tags`).

### `supabase/functions/utils/retrieve.ts`

- Implements keyword-based relevance scoring.
- Returns top 3 matching entries for prompt grounding.

Current approach:

- Lightweight keyword matching (RAG-lite), not vector embeddings yet.

## 5) Secrets and Provider Keys

Set these in Supabase Edge Function secrets:

- `PRIMARY_AI_API_KEY` (primary AI route)
- `GEMINI_API_KEY` (fallback route)

Backward compatibility:

- Code also checks `LOVABLE_API_KEY` if `PRIMARY_AI_API_KEY` is not set.

Set secrets via CLI:

```bash
supabase secrets set PRIMARY_AI_API_KEY="YOUR_PRIMARY_KEY"
supabase secrets set GEMINI_API_KEY="YOUR_GEMINI_KEY"
```

## 6) Deployment Steps

From project root:

```bash
supabase login
supabase link --project-ref ooawknpqnwafhkufreyz
supabase functions deploy legal-chat
supabase functions deploy summarize-legal-doc
supabase functions deploy text-to-speech
```

## 7) Runtime Call Paths

Frontend call targets:

- Chat:
  - `${VITE_SUPABASE_URL}/functions/v1/legal-chat`
- PDF summary:
  - `supabase.functions.invoke("summarize-legal-doc", ...)`
- TTS:
  - `supabase.functions.invoke("text-to-speech", ...)`

Authorization used:

- `Bearer ${VITE_SUPABASE_PUBLISHABLE_KEY}` for direct function fetches.

## 8) CORS and Auth Behavior

Each function:

- Handles `OPTIONS` preflight and returns `corsHeaders`.
- Has `verify_jwt = false` in `supabase/config.toml`.

Implication:

- Calls are accepted without strict JWT verification.
- For production hardening, consider enabling JWT checks and additional abuse controls.

## 9) Observability and Error Codes

Function code explicitly handles:

- `429` rate limits
- `402` credit exhaustion
- Generic `500` provider/internal failures

Where to inspect:

- Supabase Dashboard -> Edge Functions -> Logs

## 10) Security Notes (Important)

- Never expose private provider keys in frontend code.
- Keep API secrets in Supabase function secrets only.
- Rotate keys if they were ever committed or shared publicly.
- Consider adding request throttling and stricter auth for production.

## 11) Quick Verification Checklist

- `.env` has valid:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
- Supabase secrets set:
  - `PRIMARY_AI_API_KEY`
  - `GEMINI_API_KEY`
- Functions deployed successfully:
  - `legal-chat`
  - `summarize-legal-doc`
  - `text-to-speech`
- Chat streams responses without errors.
- PDF summaries and TTS return expected payloads.

