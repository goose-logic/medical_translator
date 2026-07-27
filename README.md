# medical_translator

An NHS medical-navigation demo that translates and explains healthcare
information in the patient's preferred language.

## AI / translation setup

Translation and text tasks resolve their model through `lib/ai.ts`. Set
**`GOOGLE_GENERATIVE_AI_API_KEY`** (free key from
<https://aistudio.google.com/apikey>) to call Google's Gemini directly and
avoid the Vercel AI Gateway's rate-limited free tier. Without it, the app falls
back to the Gateway (`AI_GATEWAY_API_KEY`).

> ⚠️ **This is a demo configuration and is not safe for real patient /
> confidential data.** The free/hosted model tiers may reuse submitted content.
> See [`NOTES.md`](./NOTES.md) for the details and exactly what to rewire
> (starting with `lib/ai.ts`) before any confidential use.
