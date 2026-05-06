# SPEC — Saathi CRM

## Overview

A mobile-first PWA where the owner adds customers via voice + photo and sends AI-drafted WhatsApp follow-ups. Owner uses iOS Safari. PWA, installable, offline shell.

## User journey

1. Owner opens `https://saathi.<domain>` on iPhone Safari, adds to home screen on first run.
2. Lands on **Today** screen. Sees today's added customers and a single primary action: **Record**.
3. Taps **Record**, speaks for 5–20 seconds in Telugu/Hindi/English, taps stop.
4. Taps camera, captures car photo.
5. Reviews parsed fields, edits if needed, taps **Save**.
6. Goes to **Customers** later, filters by **Lapsed**, picks a customer, taps **Draft follow-up**.
7. Reads draft, edits if needed, taps **Send**. WhatsApp message arrives on the customer's phone.

## Main screens (5 total)

### 1. Today
- Header: shop name, language switcher (EN / HI / TE flags), date
- Stat row: *Today's customers* count, *Lapsed* count
- Recent customers list (latest 5)
- Sticky bottom: **Record** primary button (marigold)

### 2. Record (modal-fullscreen)
- Big mic button, holds-to-record OR tap-to-toggle
- Live waveform during recording
- After stop: shows transcript draft, **Add Photo** secondary action
- After photo: shows photo thumbnail, **Save** primary action
- During processing: honest status text (*Transcribing... · Parsing... · Saving...*)

### 3. Customers
- Search bar (search by name / phone / plate)
- Filter chips: **All · Today · Lapsed (60+d) · Repeat**
- List rows: name · car make + plate · last visit date · status dot
- Tap row → Customer Detail

### 4. Customer Detail
- Customer summary at top: name, phone, primary car (make + plate), last visit
- Visit history list, most recent first (date, services, amount, notes)
- Sticky bottom action bar: **Draft follow-up** primary, **Edit** secondary

### 5. Draft Review (modal-fullscreen)
- Language picker (EN / HI / TE) at top
- Drafted message in a textarea, owner can edit
- Below textarea: small log row showing function call about to fire (`whatsapp.send_text → +91 9XXX...`)
- Sticky bottom: **Send** primary
- After send: confirmation, return to Customer Detail with the new entry in history

## Functional requirements

**FR1 — Voice capture (PWA)**
Mic capture via `getUserMedia`. iOS Safari requires user gesture; recording starts on tap. Limit 30s. Submit as `audio/webm` (or `audio/mp4` on Safari) to `/api/intake`.

**FR2 — Photo capture (PWA)**
`<input type="file" accept="image/*" capture="environment">` for native camera open. Compress client-side to ≤1280px max edge before upload.

**FR3 — Server-side ASR**
Audio → AI4Bharat IndicConformer (multilingual Indic) → text. Return language detected.

**FR4 — Gemma 4 parsing (function calling)**
Text + photo → Gemma 4 with tool definitions `customer.search`, `customer.create`, `customer.update`. Model decides which tool to call based on whether car/customer matches existing records.

**FR5 — Vision-based customer ID**
If photo is provided and a license plate is visible, Gemma 4 extracts plate text. Plate becomes a soft customer key (deduplicates intake).

**FR6 — Customer record write**
Server executes the tool call against Supabase. Returns the resulting record + a confidence score.

**FR7 — Draft generation**
Gemma 4 reads customer's last 3 visits + most recent notes, generates a follow-up message in selected language. Strict instructions: no emojis, no marketing fluff, no sign-off line, ≤4 sentences.

**FR8 — WhatsApp send**
Function call `whatsapp.send_text` (session-context window) or `whatsapp.send_template` (out-of-window) hits Meta WhatsApp Business Cloud API. Returns message ID. Logged to Supabase `messages` table.

**FR9 — Multilingual UI**
EN / HI / TE for chrome. Telugu and Hindi UI strings hand-reviewed (not LLM-translated). Customer-visible content (drafts) is multilingual via Gemma 4.

**FR10 — Demo mode**
Query param `?demo=1` enables: visible function-call log rows, latency timings, an info line under each AI action showing model name + token count. Hidden by default in production.

## Non-functional requirements

- iOS Safari is primary target; Chrome desktop is dev convenience only
- Saathi Saffron design tokens (no other colors)
- Anti-slop rules (`ANTI_SLOP.md`) enforced in PR reviews
- Latency target: voice intake end-to-end ≤8s on a 4G connection
- Latency target: draft generation ≤6s
- Server-side errors: graceful UI states with retry, never a generic "Something went wrong"
- No customer data leaves Supabase + Meta WhatsApp Cloud
- All telemetry off by default; no analytics SDKs

## Stack

- Next.js 14+ App Router
- TypeScript strict mode
- Tailwind CSS + Saathi Saffron token file
- Supabase: Postgres + Storage + RLS (single-tenant for pilot, RLS still enforced)
- Server-side Gemma 4 endpoint (Cloudflare Tunnel → Mac local; Modal/RunPod backup)
- AI4Bharat IndicConformer (server-side, Hugging Face hosted endpoint or self-hosted)
- Meta WhatsApp Business Cloud API
- Vercel hosting (free tier)
- PWA via `next-pwa` or hand-rolled manifest

## Repo quality requirements

- Clear README with `<10 min` setup
- `.env.example` with every required key
- One `npm run seed` to populate demo customers
- Clean adapter pattern around Gemma calls
- Function call schemas in a single file (`lib/ai/tools.ts`)
- No hardcoded secrets
- Apache 2.0 LICENSE
