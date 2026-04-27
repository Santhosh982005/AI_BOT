# Nyaya Mitra Architecture README

This document is presentation-ready and explains the project architecture clearly for viva/demo use.

## 1) Project Title

**Nyaya Mitra: Multilingual AI Legal Assistant for India**

## 2) Problem Statement

Many users cannot easily understand legal processes due to:

- complex legal language
- language barriers
- limited access to quick legal guidance
- difficulty reading legal documents

Nyaya Mitra addresses this by providing simplified, multilingual legal guidance through chat and document summarization.

## 3) High-Level Architecture

The system follows a **hybrid retrieval + LLM architecture**:

1. User Input
2. Query Packaging
3. Retrieval Layer (domain legal context)
4. Prompt-Guided Reasoning
5. AI Response Engine
6. Multilingual Response
7. User Output Interface
8. Feedback & Improvement

## 4) Architecture Flow (Explained)

### 4.1 User Input

- User asks legal questions via text or voice.
- User can upload legal PDFs for summary.

**Files:**
- `src/components/ChatPanel.tsx`
- `src/components/PdfPanel.tsx`

### 4.2 Query Packaging

- Frontend collects chat history + current query + selected language.
- Request is sent to Supabase Edge Function.

**Files:**
- `src/components/ChatPanel.tsx`
- `supabase/functions/legal-chat/index.ts`

### 4.3 Retrieval Layer (Grounding)

- Backend uses a legal Q&A dataset.
- Lightweight keyword-based scoring fetches top relevant entries.
- Retrieved context is injected into prompt as `Case 1`, `Case 2`, `Case 3`.

**Files:**
- `supabase/functions/utils/legalKnowledge.ts`
- `supabase/functions/utils/retrieve.ts`
- `supabase/functions/legal-chat/index.ts`

### 4.4 Prompt-Guided Reasoning

- A structured master prompt controls:
  - simple explanation
  - actionable next steps
  - safety rules
  - strict output format
- If no relevant context is found, model is instructed to provide general guidance and state uncertainty.

**File:**
- `supabase/functions/legal-chat/index.ts`

### 4.5 AI Response Engine

- Primary provider route is used first.
- Gemini is used as fallback if primary fails.
- Chat responses are streamed (SSE).

**Files:**
- `supabase/functions/legal-chat/index.ts`
- `supabase/functions/summarize-legal-doc/index.ts`
- `supabase/functions/text-to-speech/index.ts`

### 4.6 Multilingual Response

- Language options: English, Hindi, Tamil.
- Prompt enforces response language.
- UI placeholders/labels adapt to selected language.

**Files:**
- `src/components/LanguageSelect.tsx`
- `src/components/ChatPanel.tsx`

### 4.7 User Output Interface

- Chat bubbles with markdown formatting.
- Streaming partial responses for smooth user experience.
- PDF summary shown in structured plain-language format.
- Optional voice playback.

**Files:**
- `src/components/ChatPanel.tsx`
- `src/components/PdfPanel.tsx`
- `src/components/Hero.tsx`
- `src/components/Header.tsx`

### 4.8 Feedback & Improvement

- UI toasts for failures/retry guidance.
- Backend status handling (`429`, `402`, `500`) for resilience.
- Function logs support iterative improvement.

**Files:**
- `src/components/ChatPanel.tsx`
- `src/components/PdfPanel.tsx`
- `supabase/functions/*`

## 5) Why This Architecture Is Defensible

### Earlier risk

- Pure prompt-based LLM could overclaim architecture.

### Current strength

- Real retrieval layer exists (dataset + matching + context injection).
- Reasoning is constrained by prompt and safety instructions.
- Multilingual and streaming UX are implemented in production flow.
- Provider fallback improves reliability.

## 6) Design Choices and Trade-offs

### Chosen now

- **Keyword-based retrieval (RAG-lite)**
  - easy to explain
  - low complexity
  - fast implementation

### Trade-off

- less semantic accuracy vs embedding search

### Planned upgrade

- vector embeddings + semantic similarity retrieval

## 7) Data Reliability and Safety

- Retrieval dataset is contextual grounding, not a certified legal database.
- System avoids hard legal authority claims.
- The assistant provides general legal information, not final legal advice.
- Avoids fabricating laws/sections through explicit safety instructions.

## 8) Technical Stack (Architecture Perspective)

### Frontend

- React + TypeScript + Vite
- Tailwind + shadcn UI
- React Markdown
- PDF.js

### Backend

- Supabase Edge Functions (Deno)
- Supabase client integration
- Retrieval utility layer
- Streaming response handling

### AI Orchestration

- Primary provider route via gateway
- Gemini fallback path
- Prompt-controlled structured output

## 9) End-to-End Runtime Sequence

### Chat

1. User enters query.
2. Frontend sends `{ messages, language }` to `legal-chat`.
3. Backend retrieves relevant legal context.
4. Backend builds grounded prompt and calls AI provider.
5. Streamed response is returned to UI.
6. UI renders markdown in real time.

### PDF

1. User uploads PDF.
2. Browser extracts text page-by-page.
3. Frontend sends text to `summarize-legal-doc`.
4. Backend generates simplified summary.
5. UI displays summary.

## 10) Current Limitations

- Retrieval is keyword-based, not semantic.
- PDF summarization currently uses direct LLM summarization (no retrieval layer yet).
- Test coverage is basic.

## 11) Future Enhancements

- Semantic retrieval with embeddings and vector DB
- Citation-backed legal response generation
- Enhanced analytics for response quality and safety
- Stronger auth/rate control at function level

## 12) Viva-Ready Explanation (Use this directly)

“Our project uses a hybrid architecture, not just direct prompting.  
The system first captures user input, then performs lightweight retrieval from a legal Q&A dataset, injects that context into a structured safety prompt, and generates multilingual simplified legal guidance through an LLM.  
We added provider fallback and streaming delivery for reliability and UX.  
This makes the architecture technically defensible and aligned with implementation.”

