# Nyaya Mitra

Nyaya Mitra is a multilingual AI legal assistant web app focused on simple legal guidance for Indian users.  
It supports:

- Legal question answering in simple language
- English, Hindi, and Tamil responses
- Voice input (speech-to-text) and voice output (text-to-speech)
- Legal PDF summarization with action-oriented output

This README explains the complete project structure, technology stack, architecture mapping, and each major file's purpose.

## 1) Project Overview

Nyaya Mitra helps users understand legal problems in plain language.  
Users can either:

- Ask legal questions in chat (text/voice), or
- Upload a legal document (PDF) and get a simplified summary.

The frontend is built with React + Vite, while backend AI processing runs through Supabase Edge Functions.

## 2) System Architecture (Mapped to Your Diagram)

Your diagram flow:

1. User input / query
2. Query Packaging (frontend)
3. Retrieval Layer (domain legal dataset)
4. Prompt-Guided Reasoning
5. AI response engine
6. Multilingual translation engine
7. User output interface
8. Feedback & improvement loop

How this project implements each stage:

### 2.1 User input / query

- User enters text in chat box
- User can use browser speech recognition for voice input
- User can upload legal PDF for summarization

Implemented in:

- `src/components/ChatPanel.tsx`
- `src/components/PdfPanel.tsx`

### 2.2 Query Packaging (frontend)

- Chat history and current user message are packaged and sent to backend
- Language selection (`en`, `hi`, `ta`) is included in requests
- LLM-based query understanding is guided with lightweight preprocessing and formatting rules

Implemented in:

- `src/components/ChatPanel.tsx` (request construction + stream parsing)
- `supabase/functions/legal-chat/index.ts` (prompt + inference orchestration)

### 2.3 Retrieval Layer (New)

- A legal Q&A dataset is used as a domain context layer for chat
- Basic similarity matching fetches the top relevant legal entries
- Current implementation uses keyword-based scoring for relevance matching.
- Retrieved entries are injected into the prompt before reasoning
- This improves grounding and helps reduce hallucination risk

Implemented in:

- `supabase/functions/legal-chat/index.ts`
- `supabase/functions/utils/legalKnowledge.ts`
- `supabase/functions/utils/retrieve.ts`
- `supabase/functions/summarize-legal-doc/index.ts`

Hybrid legal knowledge layer:

- Retrieval from a domain-specific legal Q&A dataset
- LLM-based reasoning for simplification and explanation

Note: current retrieval uses lightweight matching (not embeddings yet).

### Data Reliability Note

- The legal dataset is used for contextual grounding only
- It may not represent authoritative or fully verified legal sources
- The system avoids strict legal claims and focuses on simplified guidance
- Future work includes integrating verified legal databases and citations

### 2.4 Prompt-Guided Reasoning

- Retrieved legal context + user query are combined into grounded prompts
- LLM produces plain-language, structured legal guidance
- Output format is constrained for consistency and readability

Implemented in:

- `supabase/functions/legal-chat/index.ts`

### 2.5 AI response engine

- Primary AI gateway call is made from Edge Functions
- Gemini fallback is supported if primary provider fails
- Streaming is supported for chat responses

Implemented in:

- `supabase/functions/legal-chat/index.ts`
- `supabase/functions/summarize-legal-doc/index.ts`
- `supabase/functions/text-to-speech/index.ts`

### 2.6 Multilingual translation engine

- Language selection is first-class (`en`, `hi`, `ta`)
- Prompt instructs assistant to respond in selected language
- UI labels and placeholders adapt to selected language

Implemented in:

- `src/components/LanguageSelect.tsx`
- `src/components/ChatPanel.tsx`
- `supabase/functions/legal-chat/index.ts`

### 2.7 User output interface

- Chat bubbles with markdown rendering
- Streaming assistant output for smooth UX
- PDF summary panel with formatted text
- Voice playback for assistant response

Implemented in:

- `src/components/ChatPanel.tsx`
- `src/components/PdfPanel.tsx`
- `src/components/Hero.tsx`
- `src/components/Header.tsx`
- `src/components/Footer.tsx`

### 2.8 Feedback & improvement loop

- Error handling and toasts provide immediate user feedback
- Request outcomes (success/failure/rate limits) are surfaced in UI
- Logs in edge functions help iterative quality improvements

Implemented in:

- `src/components/ChatPanel.tsx`
- `src/components/PdfPanel.tsx`
- `supabase/functions/*`

## 3) Tech Stack and Skills Used

### Frontend

- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui + Radix UI
- React Router
- React Query
- React Markdown
- PDF.js (`pdfjs-dist`)
- Browser SpeechRecognition API (voice input)
- Streaming UI rendering with SSE chunk parsing
- Responsive UI composition and reusable component architecture

### Backend / AI Integration

- Supabase Edge Functions (Deno runtime)
- Supabase JS client
- Retrieval layer using domain legal dataset
- Lightweight relevance matching (`retrieveRelevantContext`)
- Prompt orchestration with grounded context injection
- AI gateway provider calls (primary)
- Google Gemini fallback (`GEMINI_API_KEY`)
- SSE-compatible response shaping for chat streaming
- Text-to-speech generation for assistant output

### Testing / Tooling

- Vitest
- Testing Library
- ESLint
- npm scripts for local dev/build/test/lint workflow

### Technical Skills Demonstrated

- **Full-stack TypeScript development** across React frontend and Deno edge functions
- **LLM application engineering** with prompt design, structured output constraints, and safety guardrails
- **Hybrid retrieval + generation (RAG-lite)** using legal domain context before response generation
- **Fault-tolerant provider orchestration** with primary model route and Gemini fallback
- **Real-time streaming UX** by parsing and rendering partial assistant tokens
- **Multilingual product design** for English/Hindi/Tamil interaction flows
- **Voice-enabled legal assistant UX** (speech input + audio response output)
- **Document intelligence pipeline** (PDF extraction, normalization, and legal summarization)
- **API and secret management** using environment variables and Supabase secrets
- **Architecture-to-implementation mapping** to align system design claims with executable modules

## 4) Directory and File Purpose

### Root files

- `package.json`  
  Project scripts and dependencies.

- `vite.config.ts`  
  Vite dev server and build config, alias setup (`@ -> ./src`).

- `vitest.config.ts`  
  Test runner configuration.

- `tsconfig*.json`  
  TypeScript compiler configurations.

- `tailwind.config.ts`, `postcss.config.js`  
  Styling pipeline configuration.

- `index.html`  
  HTML entry with metadata and favicon.

### Frontend source (`src/`)

- `src/main.tsx`  
  React app entrypoint and mount.

- `src/App.tsx`  
  App-level providers (React Query, toasts, tooltip) and routes.

- `src/pages/Index.tsx`  
  Main page composition.

- `src/pages/NotFound.tsx`  
  Fallback route page.

- `src/components/Header.tsx`  
  Top navigation and language selector.

- `src/components/Hero.tsx`  
  Landing section and quick action buttons.

- `src/components/ChatPanel.tsx`  
  Core chat experience:
  - user input
  - streaming assistant response
  - voice input
  - voice output
  - response rendering and safeguards

- `src/components/PdfPanel.tsx`  
  PDF upload and summarization flow:
  - PDF validation
  - text extraction via PDF.js
  - summary request to edge function

- `src/components/LanguageSelect.tsx`  
  Language options and selector UI.

- `src/components/Footer.tsx`  
  Footer branding and disclaimer.

- `src/components/ui/*`  
  Reusable UI components (shadcn/Radix-based).

- `src/integrations/supabase/client.ts`  
  Supabase client setup using Vite env variables.

- `src/hooks/*`  
  Utility hooks (toast, mobile helpers).

- `src/index.css`  
  Global styles, theme tokens, gradients, typography.

### Backend functions (`supabase/functions/`)

- `supabase/functions/legal-chat/index.ts`  
  Legal chat backend:
  - receives messages + language
  - retrieves relevant legal context from dataset
  - builds grounded legal prompt template
  - calls primary AI provider
  - falls back to Gemini when needed
  - returns SSE stream

- `supabase/functions/utils/legalKnowledge.ts`  
  Domain legal Q&A dataset used for retrieval grounding.

- `supabase/functions/utils/retrieve.ts`  
  Lightweight similarity matching utility to fetch top relevant legal context.

- `supabase/functions/summarize-legal-doc/index.ts`  
  Document summary backend:
  - receives extracted document text
  - generates structured simplified legal summary
  - primary provider + Gemini fallback

- `supabase/functions/text-to-speech/index.ts`  
  TTS backend:
  - receives text
  - generates MP3 audio
  - returns base64 audio content

- `supabase/config.toml`  
  Supabase local/project configuration.

## 5) Environment Variables and Secrets

### Frontend (`.env`)

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID` (optional metadata usage)

### Edge Function secrets (set in Supabase)

- `PRIMARY_AI_API_KEY` (primary provider key)
- `GEMINI_API_KEY` (fallback provider key)

Backward compatibility:

- If `PRIMARY_AI_API_KEY` is not set, code also checks `LOVABLE_API_KEY`.

## 6) How Data Flows End-to-End

### Chat flow

1. User types/speaks in `ChatPanel`
2. Frontend sends `{ messages, language }` to `legal-chat`
3. Edge function generates response (stream)
4. Frontend parses SSE chunks and updates chat live
5. Optional TTS request converts assistant text to audio

### PDF summary flow

1. User uploads PDF in `PdfPanel`
2. Browser extracts text page-by-page using PDF.js
3. Frontend sends extracted text to `summarize-legal-doc`
4. Edge function returns simplified legal summary
5. Frontend renders summary in markdown view

Note: PDF summarization currently uses direct LLM processing and does not utilize the retrieval layer.

## 7) Local Development

Install dependencies:

```bash
npm install
```

Run dev server:

```bash
npm run dev
```

App runs on:

- `http://localhost:8080`

## 8) Testing and Linting

Run lint:

```bash
npm run lint
```

Run tests:

```bash
npm run test
```

Watch tests:

```bash
npm run test:watch
```

## 9) Deploying Edge Functions

Install Supabase CLI (if missing):

```bash
npm install -g supabase
```

Login and link project:

```bash
supabase login
supabase link --project-ref <YOUR_PROJECT_REF>
```

Set required secrets:

```bash
supabase secrets set PRIMARY_AI_API_KEY="YOUR_PRIMARY_KEY"
supabase secrets set GEMINI_API_KEY="YOUR_GEMINI_KEY"
```

Deploy functions:

```bash
supabase functions deploy legal-chat
supabase functions deploy summarize-legal-doc
supabase functions deploy text-to-speech
```

## 10) Current Limitations and Future Improvements

Current limitations:

- Retrieval is lightweight keyword/similarity matching (not vector embeddings)
- Basic test coverage
- TTS fallback provider not yet added (single path)

Recommended next improvements:

- Upgrade retrieval to embeddings + vector similarity search
- Add legal source citation links in responses
- Add analytics for response quality and failure tracking
- Add richer test coverage for chat and PDF workflows
- Add stricter content policy checks for legal-risk responses

We implemented a lightweight retrieval mechanism using keyword-based scoring, which will be upgraded to semantic vector search in future work.

## 11) Summary

Nyaya Mitra is a production-oriented legal-assistance MVP that aligns with your architecture diagram:

- Input capture
- Query packaging
- Retrieval grounding
- Prompt-guided reasoning
- AI response generation
- Multilingual output
- User-friendly delivery
- Iterative feedback path

This hybrid retrieval + LLM structure makes the architecture defensible, practical, and extensible for academic and product development.
