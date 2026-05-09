# Saathi

**A voice-first CRM co-pilot for Indian small businesses.** Built on Gemma 4. Submitted to the Kaggle Gemma 4 Good Hackathon, Digital Equity track.

The owner records a 10-second voice note in Telugu, Hindi, or English, photographs the customer's car, and Saathi turns it into a tracked customer plus a draft WhatsApp follow-up — approved and sent in one tap.

The pilot is a car detailing studio in Hyderabad. The architecture generalizes to any micro-business that runs on a phone and lives on WhatsApp.

| | |
|---|---|
| Live PWA | https://saathi-crm.vercel.app |
| Submission write-up | [docs/SUBMISSION.md](docs/SUBMISSION.md) |
| License | Apache 2.0 (matches Gemma 4) |

## Quick demo (after env setup)

```bash
git clone https://github.com/JagadeepPortfolio/saathi-crm
cd saathi-crm
npm install
cp .env.example .env.local        # fill in keys per below
npm run dev
```

Open `http://localhost:3000`. Try Today → Customers → pick Ramesh → Draft follow-up. Append `?demo=1` to any URL to see the live Gemma 4 → Twilio function-call trace.

## Setup checklist

1. **Supabase** — create project at [supabase.com](https://supabase.com), copy URL and **secret** key (`sb_secret_*`, not the publishable one) to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
   SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
   ```
   Apply schema (paste into the Supabase SQL editor or use psql):
   ```bash
   psql <connection-string> < supabase/schema.sql
   psql <connection-string> < supabase/policies.sql
   psql <connection-string> < supabase/seed.sql
   ```
   Then create the storage buckets:
   ```bash
   npx tsx scripts/setup_storage.ts
   ```

2. **Gemma 4 + whisper.cpp** — local on a Mac M1/M2 or better:
   ```bash
   brew install ollama whisper-cpp ffmpeg
   ollama pull gemma4:e4b
   mkdir -p models
   curl -L -o models/ggml-large-v3-turbo.bin \
     https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin
   ollama serve &
   ```
   Default endpoint `http://localhost:11434` is what the adapter targets. Set `GEMMA_ENDPOINT_URL` to a Cloudflare Tunnel URL when serving the dev mac to a remote iPhone.

3. **Twilio WhatsApp Sandbox** — sign up at [twilio.com](https://twilio.com), open the WhatsApp Sandbox, send the `join <phrase>` message from your own iPhone to verify it as a recipient. Then:
   ```
   WHATSAPP_PROVIDER=twilio
   TWILIO_ACCOUNT_SID=AC...
   TWILIO_AUTH_TOKEN=...
   TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
   WHATSAPP_TEST_RECIPIENT=+91XXXXXXXXXX     # your iPhone in E.164
   ```
   The `WHATSAPP_TEST_RECIPIENT` env var is dev-only — Twilio Sandbox can only send to verified recipients, so we override the seeded customer phones with your iPhone for end-to-end testing.

4. **Optional — switch to mock WhatsApp** for UI-only iteration without firing real messages:
   ```
   WHATSAPP_PROVIDER=mock
   ```

## Validate the pipeline

Two test scripts exercise the full pipeline against included samples (`samples/ramesh_te.m4a`, `samples/swift.jpg`):

```bash
# Day 2 acceptance gates: Telugu ASR, Gemma vision + tool calling, generation, latency
npx tsx scripts/test_pipeline.ts

# Day 3 integration: full /api/intake including DB writes
npx tsx scripts/test_intake.ts
```

## Project layout

```
app/                          Next.js 16 App Router
  page.tsx                    Today screen
  customers/                  list + detail + edit + draft state machine
  record/                     full-screen intake state machine
  api/
    intake/route.ts           POST audio + photo → ASR → Gemma → DB
    customers/[id]/route.ts   GET / PATCH
    visits/[id]/route.ts      PATCH
    draft/route.ts            POST customerId → Gemma drafts in language
    send/route.ts             POST text → Twilio fires WhatsApp
    whatsapp/webhook/route.ts Twilio status callback handler
  manifest.ts                 PWA manifest
  not-found.tsx, error.tsx    Saathi-Saffron 404 + error boundary
components/
  MicCapture.tsx              iOS-Safari-aware getUserMedia + MediaRecorder
  PhotoCapture.tsx            file input with capture=environment
  StatusTicker.tsx            honest progress per docs/ANTI_SLOP.md
  ToolCallLog.tsx             demo-mode function-call trace (?demo=1)
  BottomBar.tsx, CustomersList.tsx
lib/
  ai/                         gemma + mock adapters, tools schema, prompts
  asr/                        whisper.cpp subprocess runner
  db/                         Supabase server client + scoped helpers
  whatsapp/                   twilio + mock adapters, provider selector
  i18n/                       hand-written EN / HI / TE strings
  intake.ts                   Flow 1 orchestrator (uploads → ASR → Gemma → DB)
  types.ts                    shared types
supabase/                     schema + policies + 8-customer demo seed
scripts/
  setup_storage.ts            idempotent bucket bootstrap
  test_pipeline.ts            Day 2 acceptance gates harness
  test_intake.ts              Day 3 integration test (writes to DB)
samples/
  ramesh_te.m4a               sample 25s Telugu+English code-mixed clip
  swift.jpg                   sample car photo
docs/                         spec-driven artifact pack — read this first
```

## Read the docs

The artifact pack in `docs/` is the source of truth. Read order:

1. `docs/SUBMISSION.md` ← judges read this
2. `docs/PRD.md`, `docs/SPEC.md`, `docs/ARCHITECTURE.md`
3. `docs/WORKFLOWS.md`
4. `docs/GEMMA_INTEGRATION.md` — the model setup, the `think:false` flag, capability tradeoffs
5. `docs/AI_AGENT_SPEC.md` — system prompts and tool JSON schemas
6. `docs/DATA_MODEL.md`
7. `docs/UI_UX_SPEC.md` — Saathi Saffron tokens
8. `docs/ANTI_SLOP.md` — non-negotiable UI/UX rules
9. `docs/TASKS.md` — day-by-day execution log
10. `docs/TEST_PLAN.md` — acceptance gates
11. `docs/DEMO_SCRIPT.md` — 90s submission video script

## License

Apache 2.0 — see `LICENSE`. Same as Gemma 4.
