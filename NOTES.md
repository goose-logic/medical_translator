# Project Notes — Updates & Rewiring

Running notes about how the AI/translation layer is wired and what must change
before certain use cases. Add to this file as the project evolves.

## Current AI setup (demo configuration)

Translation and the lightweight text tasks (medical translation, term
explanations, appointment summaries, UI-string localisation, and voice-intent
classification) all go through a single helper: **`lib/ai.ts` → `translationModel()`**.

It resolves the model in this order:

1. **If `GOOGLE_GENERATIVE_AI_API_KEY` is set** → calls Google's Gemini API
   **directly** (`gemini-2.0-flash`), using Google's own free tier.
2. **Otherwise** → falls back to the string `google/gemini-2.0-flash`, which
   routes through the **Vercel AI Gateway** (needs `AI_GATEWAY_API_KEY`).

We moved to the direct Google key because the Vercel AI Gateway **free tier**
is aggressively rate-limited ("Free tier requests on this model are
rate-limited…"), which took down every feature at once since they all depend on
translation. Google's free tier is rate-limited too, but by requests-per-minute
and requests-per-day that **reset** — there is no finite credit balance to drain.

### To enable the direct Google key

1. Create a free key at <https://aistudio.google.com/apikey>.
2. Add an environment variable **`GOOGLE_GENERATIVE_AI_API_KEY`** (in Vercel/v0
   project settings, or `.env.local` for local dev).
3. Redeploy (env changes don't apply to a running deployment) / restart the dev
   server.

No key set? The app still works via the Vercel AI Gateway fallback, subject to
its rate limits.

## ⚠️ Confidentiality — MUST rewire before handling real patient data

The current setup is a **demo configuration** and is **NOT suitable for
confidential or patient-identifiable information (PII/PHI).**

- On Google's **free** Gemini tier, submitted content **may be used by Google to
  improve their products** (i.e. it is not private). The same caveat applies to
  the Vercel AI Gateway free path.
- Voice audio is also sent to **ElevenLabs** (`app/actions/speech-to-text.ts`,
  `text-to-speech.ts`) and the booking agent drives a real external site via
  **Browserbase** (`lib/booking-agent.ts`).

Before any confidential/clinical use, rewire the model layer to a
privacy-preserving option. **Change `lib/ai.ts`** (single choke point for
translation + text tasks) to one of:

- **Google paid tier / Vertex AI** — on paid Gemini and Vertex AI, prompt data
  is **not** used for training; Vertex AI can be covered by a data-processing /
  BAA-style agreement.
- **Anthropic or OpenAI on a paid plan** with **zero-retention** enabled (and a
  BAA where PHI is involved). Providers already exist in the dependency tree
  (`@ai-sdk/anthropic`, `@ai-sdk/openai`).
- **A self-hosted / on-prem model**, so no data leaves your infrastructure.

Also review, for the same reasons:

- `app/actions/speech-to-text.ts` / `text-to-speech.ts` — ElevenLabs.
- `lib/booking-agent.ts` — Browserbase + the Gateway/OpenAI model used by
  Stagehand (this path is **not** covered by `translationModel()`; it still uses
  `AI_GATEWAY_API_KEY`). Rewire separately if a fully gateway-free or
  confidential setup is required.

## Environment variables referenced by the app

| Variable | Used by | Notes |
| --- | --- | --- |
| `GOOGLE_GENERATIVE_AI_API_KEY` | `lib/ai.ts` | Preferred: direct Google Gemini (free tier). |
| `AI_GATEWAY_API_KEY` | Gateway fallback, `lib/booking-agent.ts` | Vercel AI Gateway. |
| `BROWSERBASE_API_KEY*` | `lib/booking-agent.ts` | Any `BROWSERBASE_API_KEY*` var with a `bb_` value works. |
| `ELEVENLABS_API_KEY*` | speech-to-text / text-to-speech | Voice features. |
