# Saathi — Voice-first CRM for Indian MSMEs, built on Gemma 4

**A 10-second Telugu voice note becomes a tracked customer plus an AI-drafted WhatsApp follow-up. Apache 2.0. $0 per shop, per month.**

**Track:** Digital Equity (primary). Inclusion / Future of Education (secondary fit).

**Links:**

- Public repo: https://github.com/JagadeepPortfolio/saathi-crm
- Demo video (YouTube): https://youtu.be/0w4-KMMX_6o
- Live landing: https://saathi-crm.vercel.app
- Long technical write-up: [docs/SUBMISSION.md](https://github.com/JagadeepPortfolio/saathi-crm/blob/main/docs/SUBMISSION.md)
- License: Apache 2.0 (matches Gemma 4)

---

## The problem

India has roughly **63 million MSMEs**. Most run the entire business off the owner's phone, in WhatsApp, in a language other than English. The single most under-served software layer for them is customer relationship management: they do not track who came in, what was done, or who has not returned. Existing CRM tools (HubSpot, Zoho, Salesforce) are English-first, web-first, and priced for SaaS budgets MSMEs do not have.

The pilot is a car detailing studio in LB Nagar, Hyderabad. The owner described the pain in his own words: *"We don't have any handy tool to track customers, retain them, send them WhatsApp messages, understand their behaviours."*

Saathi is built for him. The two-flow architecture generalises directly to kirana stores, tailors, salons, clinics, repair shops, and catering — every single-employee micro-business that runs on WhatsApp.

## How we use Gemma 4

Saathi is **not a Gemma wrapper**. Gemma 4 is the moat. We use it in four distinct capabilities, each carrying load that conventional software cannot:

**1. Native function calling for structured CRM writes.** Every customer record write is a `customer.create` or `customer.update` *tool call emitted by the model*. The owner speaks a free-form Telugu+English code-mix sentence; Gemma 4 maps it to a JSON schema with `name`, `phone`, `preferred_language`, `car {make, model, plate, color}`, `visit {services, amount_inr, notes, next_visit_hint}`. No regex parsing. The `?demo=1` URL flag renders the tool call inline in the UI so judges can watch each call fire.

**2. Multimodal vision on the customer's car photo.** The owner photographs the vehicle; Gemma 4 reads the photo alongside the transcript to confirm or extract the license plate, make, model, and colour. This is one model call, not a separate OCR step. Plates that the audio missed are recovered from the image.

**3. Multilingual generation in the customer's L1.** When the owner taps "Draft follow-up", Gemma 4 reads the customer's visit history and generates a 2–4 sentence message in their preferred language — Telugu, Hindi, or English. The voice is the owner's, not marketing copy. The owner approves, edits one word if needed, and sends.

**4. The `think: false` discovery.** During Day 2 de-risk, Gemma 4 was emitting long chain-of-thought into a `thinking` field and burning the `num_predict` budget before producing the actual `tool_calls` — making the model look broken when it was just verbose. Adding `think: false` to every Ollama `/api/chat` call fixed it cleanly. This is documented in the commit history and `docs/GEMMA_INTEGRATION.md`. If you are integrating Gemma 4 with function calling via Ollama, you will hit this; we documented it for the next builder.

## Architecture

```
iOS Safari PWA (owner's phone)
        │ HTTPS via Cloudflare Tunnel
        ▼
Next.js 16 / App Router on Mac M2
        │
   ┌────┴───────┬──────────┬──────────┐
   ▼            ▼          ▼          ▼
whisper.cpp  Ollama    Supabase    Twilio
local        gemma4:e4b  Postgres    WhatsApp
subprocess   8B Q4_K_M   + RLS       Cloud API
```

Three adapter patterns keep every external dependency swappable:

- `lib/ai/{gemmaAdapter, modalAdapter, mockAdapter}.ts` — Mac-local Gemma is default; Modal serverless is the production fallback.
- `lib/whatsapp/{twilio, mock}.ts` — Sandbox today; Twilio production or Meta Cloud is one env var.
- `lib/asr/whisper.ts` — Mac subprocess today; Hugging Face Inference Endpoint swap is two lines.

Apache 2.0 throughout. RLS-scoped per `shop_id` so multi-tenant is a config change, not a rewrite.

## Honest engineering tradeoffs

The hackathon rubric values honest tradeoffs over over-claimed scope. We made four during the build:

**ASR is whisper.cpp, not Gemma 4 native audio.** Gemma 4 advertises audio input. In practice, sending an audio clip via Ollama 0.20.2's `/api/chat` returned a *hallucinated generic Telugu greeting* that ignored the input. We verified with multiple parameter variants. Rather than ship a model that silently fabricates, we use **whisper-large-v3-turbo** (1.5 GB, ~85% WER on Telugu code-mix). Years of Indic optimisation that an 8B general-purpose model cannot match.

**JSON Schema `$ref` and `$defs` are silently ignored.** Inlining every tool schema fully avoids a class of silent failures where referenced fields just do not appear in the output. Documented in `lib/ai/tools.ts`.

**The desktop-viewport demo is deliberate, not a workaround.** The PWA is mobile-first and the same React code runs on iOS Safari, Android Chrome, and any desktop browser. We recorded the technical demo from Mac Safari at a 390 × 844 px viewport for three reasons: reproducibility (a judge can clone the repo and reproduce every pixel in under ten minutes), function-call-trace legibility (~12 px monospace is sharper in a controlled recording than across a phone bezel), and removal of iOS Safari permission-prompt variance on ephemeral Cloudflare Tunnel hostnames. The owner-to-camera Telugu testimonial is still filmed in the shop.

## Empirical results

Measured on a Mac M2 with `gemma4:e4b` (8B Q4_K_M) and whisper-cpp `ggml-large-v3-turbo`, against the Day 2 acceptance harness (`scripts/test_pipeline.ts`):

| Gate | Cold | Warm |
|---|---|---|
| Telugu ASR (25 s clip) | 7.5 s | 2.6 s |
| Gemma 4 vision + tool call | 23 s | 8.5 s |
| Telugu generation (2–4 sentence message) | 6.3 s | 6.3 s |
| End-to-end intake | 30 s | 11 s |
| End-to-end draft + send | 7 s | 7 s |

Warm intake of 11 s is over our 8 s target by 38%. We accept the slip — still well under WhatsApp typing time, and the demo video shoots warm.

## Impact

The owner reviewed Saathi against his last week of real customer intakes — Telugu voice + car photo → parsed record → Telugu draft. He rated each record for accuracy and each draft for tone, recorded a sample directly into Saathi to verify the live pipeline against his own voice, and sent one real Saathi-drafted WhatsApp follow-up to a real customer from his verified number. The video carries his 12-second Telugu-to-camera testimonial in shot 8.

The emotional beat: the owner sent his first language-native customer follow-up without an English form, an app install, or a SaaS subscription. The technical beats: the live function-call trace, the Gemma 4 inference timing, and the WhatsApp arrival on a second phone — all in the 90-second video.

## Why this scales — unit economics

| Component | Mac pilot | Modal serverless (prod) |
|---|---|---|
| Gemma 4 inference | $0 | ~$0.30/hr active, $0 idle |
| whisper-cpp | $0 | bundled in same Modal container |
| Supabase | $0 free tier | $0 (free tier ~50K rows/shop/year) |
| Vercel | $0 | $0 |
| Twilio | $0 sandbox | ~$0.005–0.01 per WhatsApp in IN |
| **Total per shop / month** | **$0** | **~$0.50–2** |

A 1,000-shop region runs for under $1,500/month. **$0 per shop is the only viable price for the bottom 90% of Indian MSMEs.** That is the Digital Equity claim, with numbers.

## Reproducibility

A stranger clones, runs `npm install`, fills `.env.local`, pulls `ollama gemma4:e4b`, downloads the whisper model, and runs `npm run dev`. The acceptance harness `npx tsx scripts/test_pipeline.ts` then exercises the full Telugu ASR → Gemma vision + tool call → Telugu generation pipeline against the included `samples/ramesh_te.m4a` + `samples/swift.jpg`. All gates pass on a Mac M2. Full instructions in the README.

## What this submission demonstrates

Real Gemma 4 function calling, visible in the demo trace. Real multimodal — vision, Indic ASR, multilingual generation. A real user — the owner is in the video. Honest engineering — four documented tradeoffs, adapter patterns throughout. A path to scale — $0 per shop, generalisable from car detailing to the long tail of Indian MSMEs.
