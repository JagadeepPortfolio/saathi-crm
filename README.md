# Saathi

**A voice-first CRM co-pilot for Indian small businesses.** Built on Gemma 4. Submitted to the Kaggle Gemma 4 Good Hackathon, Digital Equity track.

The owner records a 10-second voice note in Telugu, Hindi, or English, photographs the customer's car, and Saathi turns it into a tracked customer plus a draft WhatsApp follow-up — approved and sent in one tap.

The pilot is a car detailing studio in Hyderabad. The architecture generalizes to any micro-business that runs on a phone and lives on WhatsApp.

## Quick start

```bash
git clone <repo-url> saathi-crm
cd saathi-crm
npm install
cp .env.example .env.local
# fill in Supabase URL + service role key
npm run dev
```

Open `http://localhost:3000`.

## Setup checklist

1. **Supabase project** — create at [supabase.com](https://supabase.com), copy URL and service role key to `.env.local`. Apply schema:
   ```bash
   psql <connection-string> < supabase/schema.sql
   psql <connection-string> < supabase/policies.sql
   psql <connection-string> < supabase/seed.sql
   ```
   Or paste each into the Supabase SQL editor.

2. **WhatsApp Business** — register a test number in [Meta Business Suite](https://business.facebook.com/), put the phone ID + token in `.env.local`. Webhook verify token is anything you pick.

3. **Gemma 4 endpoint** — Day 2. Run llama.cpp / MLC locally on a Mac, expose via `cloudflared tunnel`, set `GEMMA_ENDPOINT_URL`. See `docs/GEMMA_INTEGRATION.md`.

4. **AI4Bharat IndicConformer** — Day 2. Either Hugging Face Inference Endpoint or self-hosted; set `INDIC_CONFORMER_URL`.

## Project layout

```
app/         Next.js App Router (Today, Customers, Record, Draft)
components/  UI components, all using Saathi Saffron tokens
lib/
  ai/        adapter pattern around Gemma 4
  asr/       IndicConformer client
  db/        Supabase server client
  whatsapp/  Meta WhatsApp Business client
  i18n/      hand-written EN / HI / TE strings
  types.ts   shared types
supabase/    schema + policies + demo seed
docs/        spec-driven artifact pack — read this first
```

## Read the docs

The artifact pack in `docs/` is the source of truth. Read order:

1. `docs/PRD.md`
2. `docs/SPEC.md`
3. `docs/ARCHITECTURE.md`
4. `docs/WORKFLOWS.md`
5. `docs/GEMMA_INTEGRATION.md`
6. `docs/AI_AGENT_SPEC.md`
7. `docs/DATA_MODEL.md`
8. `docs/UI_UX_SPEC.md`
9. `docs/ANTI_SLOP.md`
10. `docs/TASKS.md` (day-by-day plan)

## License

Apache 2.0 — see `LICENSE`. Same as Gemma 4.
