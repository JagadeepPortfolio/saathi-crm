# Tasks — Saathi CRM, 12-day plan

Plan kicked off **2026-05-06**. Submission deadline **2026-05-18**. Solo, Claude Code Max 5x, Mac, iPhone, no Android.

Each day has: **goal**, **deliverables**, **fail-fast checks**, **timebox**. If a day's fail-fast check fails, stop and pivot — do not push into the next day on a broken foundation.

---

## Status (live)

- ✅ **Day 1 — 2026-05-06/07**: scaffold + Supabase + GitHub + Vercel deploy. https://saathi-crm.vercel.app live with placeholder. Twilio Sandbox swapped in for Meta WhatsApp (faster setup, real API). Schema seeded with 8 demo customers.
- ✅ **Day 2 — 2026-05-08**: Gemma 4 + whisper.cpp pipeline de-risked. All 4 acceptance gates green (Gate 4 latency 11s warm — usable for demo). Architecture pivots: ASR is whisper.cpp + ggml-large-v3-turbo (not IndicConformer), Gemma 4 audio capability declared but unreliable through Ollama 0.20.2. `think: false` flag is critical on every request.
- ⏳ **Day 3 — next**: Flow 1 backend (`/api/intake`), Supabase Storage buckets, intake-prompt iteration to fix the BlueShift→name parsing issue and notes-vs-services merging.

Known issues to fix during Day 3-4 prompt iteration (from Day 2 acceptance run):
1. Whisper sometimes drops a space ("BlueShift" instead of "Blue Shift"), and Gemma 4 then merges car-make into the customer name field
2. Visit notes occasionally land in the `services` array — needs few-shot examples
3. License plate from transcript still inconsistently extracted despite prompt update

---

## Day 1 — 2026-05-06 (Tue): Lock specs + scaffold

**Goal:** Empty Next.js PWA deploys to Vercel. Supabase project provisioned. Meta WhatsApp test number registered.

**Deliverables:**
- New project folder `saathi-crm/`, `docs/` populated with this artifact pack
- `npx create-next-app saathi-crm --typescript --tailwind --app`
- Saathi Saffron tokens in `tailwind.config.ts`
- PWA manifest, basic icons, `theme_color` set
- Supabase project created, schema + policies applied (`supabase/schema.sql`, `supabase/policies.sql`)
- Supabase seed run with one shop + 8 demo customers
- Meta Business Suite: WhatsApp Business test number registered, webhook verified
- GitHub repo created (private until Day 11), Apache 2.0 LICENSE
- Vercel project linked, first deploy green
- `.env.example` with every required var

**Fail-fast checks:**
- Visit Vercel URL → see "Saathi" wordmark on cream → ✅
- `select count(*) from customers` returns 8 → ✅
- Send WhatsApp test message via Meta Business Suite → arrives on test phone → ✅

**Timebox:** 8 hours. If WhatsApp test number is stuck in approval (rare; usually instant for test numbers), continue Day 2 work and revisit on Day 2.

---

## Day 2 — 2026-05-07 (Wed): De-risk Gemma 4 + ASR

**The most critical day.** If this day fails, the whole plan changes.

**Goal:** A Telugu voice clip flows end-to-end through ASR + Gemma 4 + tool-call extraction on the dev Mac, producing valid JSON.

**Deliverables:**
- Gemma 4 download + run on Mac (try variants: smallest first, scale up until quality threshold met)
- llama.cpp or MLC-LLM HTTP server running on `:8080`
- Cloudflare Tunnel exposing it as a public HTTPS URL
- IndicConformer running locally OR via Hugging Face Inference Endpoint
- Test script `scripts/test_pipeline.ts`:
  1. Read `samples/ramesh_te.m4a` (8s Telugu clip, recorded by you)
  2. Send to ASR → get transcript
  3. Send transcript + `samples/swift.jpg` to Gemma 4 with `customer.create` tool
  4. Print the tool call JSON
- Acceptance log saved to `docs/day2-evidence.md` with timings

**Fail-fast checks (acceptance gates):**
- ASR transcript matches the Telugu clip ≥80% word-accurate (you read the transcript and judge) → ✅
- Gemma 4 returns valid JSON with `customer.create` tool call, name "Ramesh" extracted → ✅
- License plate extracted from photo correctly → ✅ (else: plate is best-effort, owner edits — don't block)
- End-to-end latency ≤8s → ✅ (else: try a smaller variant or accept ≤15s for demo)
- Telugu generation test: prompt Gemma 4 to write a 3-sentence Telugu follow-up → owner reads it → owner says "ok" → ✅

**Pivot triggers:**
- If no Mac-local Gemma 4 variant produces acceptable Telugu → switch primary inference to Modal serverless with a larger variant. Budget impact: $20–40 for the hackathon.
- If IndicConformer Telugu accuracy is <70% → try Whisper-large-v3 + Indic prompt; if that also fails, demo in Hindi instead (still valid for hackathon).
- If both fail catastrophically → demo in English-only with code-mixed accent acceptance. Reduces narrative impact but ships.

**Timebox:** 10 hours. This day might run long; that's fine.

---

## Day 3 — 2026-05-08 (Thu): Flow 1 backend (intake)

**Goal:** `POST /api/intake` accepts multipart audio + photo, returns a parsed customer record persisted to Supabase.

**Deliverables:**
- `lib/ai/adapter.ts` interface
- `lib/ai/gemmaAdapter.ts` (CF Tunnel URL)
- `lib/ai/modalAdapter.ts` (placeholder; deploy on Day 9 if needed)
- `lib/ai/mockAdapter.ts` (unit tests)
- `lib/ai/tools.ts` with `customer.search`, `customer.create`, `customer.update` JSON schemas
- `lib/ai/prompts.ts` with the intake system prompt
- `lib/asr/indicConformer.ts`
- `lib/db/customers.ts`, `lib/db/visits.ts`, `lib/db/cars.ts`
- `app/api/intake/route.ts` — full pipeline
- Postman / curl test: POST audio + photo → 200 with parsed JSON, DB row inserted

**Fail-fast checks:**
- curl POST end-to-end works for: new customer (Telugu) → returns `customer.create` result
- curl POST works for: returning customer (matching plate) → returns `customer.update` result
- Audio file lands in Supabase Storage (`intake-audio` bucket, private)
- Photo lands in `intake-photos` bucket
- `visits.ai_tool_call_meta` populated with model name + token usage

**Timebox:** 8 hours.

---

## Day 4 — 2026-05-09 (Fri): Flow 1 frontend

**Goal:** End-to-end intake works on the owner's iPhone Safari. Owner records voice + photo, confirms parsed record, customer is added.

**Deliverables:**
- `app/page.tsx` Today screen (header, stat row, recent customers list, sticky Record button)
- `app/record/page.tsx` full-screen Record flow (mic, transcript, photo, save, confirm)
- `components/MicCapture.tsx` (getUserMedia, iOS Safari quirks handled)
- `components/PhotoCapture.tsx`
- `components/BottomBar.tsx`
- Saathi Saffron tokens applied throughout
- Honest loading states (real operation names)
- Test on iPhone Safari over the Vercel URL

**Fail-fast checks:**
- Record on iPhone, save, refresh Today → new customer visible → ✅
- iOS Safari mic permission flow works (with explainer if denied)
- iPhone camera input works for capture
- No anti-slop violations (run the visual checklist on every screen)

**Timebox:** 8 hours.

---

## Day 5 — 2026-05-10 (Sat): Flow 2 backend (draft + send)

**Goal:** `POST /api/draft` produces a Telugu draft. `POST /api/send` fires a real WhatsApp message via Meta API.

**Deliverables:**
- `lib/whatsapp/client.ts` with `sendText` and `sendTemplate` functions
- `lib/whatsapp/templates.ts` registering `lapsed_followup`, `thankyou`, `reminder` (submit for approval Day 5 morning so they're approved by Day 6)
- `lib/ai/prompts.ts` follow-up agent system prompt
- `app/api/draft/route.ts`
- `app/api/send/route.ts`
- `app/api/whatsapp/webhook/route.ts` (delivery callbacks)
- Server enforces 24h-window check (`send_text` vs `send_template`)
- curl test: draft a follow-up → review JSON → send → message arrives on test phone

**Fail-fast checks:**
- Real WhatsApp message arrives on the test phone, in Telugu, from the test number
- Webhook receives delivery + read status, updates the `messages` row
- Templates approved by Meta (or fallback to `send_text` if within window)

**Timebox:** 9 hours. WhatsApp template approval can take 1–24h — submit early.

---

## Day 6 — 2026-05-11 (Sun): Flow 2 frontend + tool-call visibility

**Goal:** End-to-end follow-up works on the owner's iPhone. Demo-mode log rows visible.

**Deliverables:**
- `app/customers/page.tsx` list with search + filter chips
- `app/customers/[id]/page.tsx` detail with visits + messages
- `components/DraftReview.tsx` modal-fullscreen
- `components/ToolCallLog.tsx` (rendered only when `?demo=1`)
- Function-call trace UI: small monospace row in `--secondary` teal
- Language pill toggle in Draft Review

**Fail-fast checks:**
- Owner picks a customer → Draft → edit → Send → message arrives → ✅
- `?demo=1` shows tool call name + duration; default URL hides it
- All UI strings are in `lib/i18n/{en,hi,te}.ts`, no hardcoded strings in components

**Timebox:** 8 hours.

---

## Day 7 — 2026-05-12 (Mon): Owner field test ★ critical

**Goal:** Owner uses Saathi unaided for one shift. You watch, capture issues, fix critical bugs same day.

**Deliverables:**
- Visit shop with the owner. Help him add Saathi to his iPhone home screen.
- Owner uses Saathi for 5+ real customers (real intake, real follow-up at the end of the day on a lapsed customer)
- You take notes silently. Don't help unless he hits a true blocker
- Capture (with permission): owner clip for the demo video; B-roll of the shop, the cars, the iPhone
- Same evening: fix the top 3 critical issues found

**Fail-fast checks:**
- Owner completes ≥3 customer intakes without help → ✅
- Owner sends ≥1 follow-up successfully → ✅
- Owner says, in his own words, that the Telugu output is accurate → ✅

**Pivot triggers:**
- If the Telugu drafts are consistently rewritten by the owner before sending → Day 8 is for prompt engineering, not UI polish
- If intake misparses repeatedly → check ASR vs Gemma. The fix is usually upstream (ASR confidence)

**Timebox:** Half-day at the shop, half-day fixing. Total 10 hours.

---

## Day 8 — 2026-05-13 (Tue): UI polish + anti-slop pass

**Goal:** Every screen passes the `ANTI_SLOP.md` final-pass checklist. Pixel-level review of the demo path.

**Deliverables:**
- Run every checklist item from `ANTI_SLOP.md`. Strip violations.
- Replace placeholder demo data with real (anonymized) data from Day 7
- Review Telugu UI strings with the owner over WhatsApp; fix any awkward phrasing
- Polish loading states: every status text is the real operation name
- Verify only one marigold button visible per screen
- Verify left-alignment everywhere
- Run `grep "—" lib/i18n/` and `grep -E "[😀-🙏]" lib/i18n/` — both must be empty
- Take fresh screenshots for the README

**Fail-fast checks:**
- Anti-slop checklist 100% pass
- README screenshots match the live site

**Timebox:** 8 hours.

---

## Day 9 — 2026-05-14 (Wed): Edge cases + reliability + Modal backup

**Goal:** Reliability hardened. Mac-independent demo path ready.

**Deliverables:**
- Empty states (no customers yet, no lapsed, first draft modal)
- Error states (mic denied, no network, ASR fail, Gemma timeout, WhatsApp send fail) — all show retry, never a generic spinner of doom
- PWA service worker for offline shell + queued WhatsApp sends
- Modal serverless adapter deployed and tested as the runtime fallback
- Stress test: 10 intakes back-to-back, 5 follow-ups, watch latency
- Iconography sweep: only allowed Lucide glyphs imported
- `grep -rE "from 'lucide-react'" components/` — verify no banned icons

**Fail-fast checks:**
- Kill the Mac's Gemma server mid-demo → traffic flips to Modal → owner doesn't notice
- Disconnect network from PWA → service worker shows offline page → reconnect, queued send fires

**Timebox:** 8 hours.

---

## Day 10 — 2026-05-15 (Thu): Demo video record

**Goal:** 90-second demo video edited and uploaded.

**Deliverables:**
- Storyboard from `DEMO_SCRIPT.md` followed shot by shot
- Owner-to-camera clip captured at the shop (12s Telugu)
- B-roll captured (shop, hands on a car, iPhone home screen, WhatsApp arriving on a second phone)
- Voiceover recorded (your voice, not AI; English; ~85 words)
- Edit in CapCut or Final Cut; subtitles burned in for Telugu segments
- Upload as unlisted YouTube; URL ready
- Backup copy uploaded to Google Drive

**Fail-fast checks:**
- Final cut ≤90s → ✅
- Owner clip is in → ✅
- One visible function-call trace shown → ✅
- Real WhatsApp arrival on second phone shown → ✅

**Timebox:** 9 hours. If the shop visit on Day 7 didn't yield enough B-roll, Day 10 starts with another shop visit.

---

## Day 11 — 2026-05-16 (Fri): Write-up + repo finalization

**Goal:** Public repo, complete README, technical write-up uploaded.

**Deliverables:**
- README: setup in <10 min, env vars, demo seed, screenshots, video link, architecture diagram
- Technical write-up (3–4 pages or equivalent): problem, solution, Gemma 4 use, function-calling examples, capability honesty, deployment, cost-to-scale, impact evidence from Day 7
- LICENSE: Apache 2.0
- Make the repo public
- Verify: clone fresh + `npm i` + `npm run dev` works end-to-end with the included `.env.example` (after they add their own keys)
- All artifact docs in `docs/` published

**Fail-fast checks:**
- Stranger test: ask a friend to clone + run, time it. <10 min → ✅
- Repo passes a grep for secrets (`grep -rE "sk_|sb_|wa_" .` returns nothing real)

**Timebox:** 8 hours.

---

## Day 12 — 2026-05-17 (Sat): Submit + buffer

**Goal:** Kaggle submission filed. Buffer for any crisis.

**Deliverables:**
- Kaggle submission with: PWA URL, repo URL, video URL, write-up
- Verify all submission fields render correctly
- Tweet / LinkedIn post (optional but recommended for impact-track judges who scan social)
- Sleep

**Fail-fast checks:**
- Kaggle confirms submission received → ✅
- Submission URLs all open from a fresh browser session

**Timebox:** 4 hours active + buffer.

---

## Day 13 — 2026-05-18: Hold

Submissions close end-of-day. Hold for emergencies only. Do not edit the live site or repo unless something critical breaks.

---

## Critical-path summary

The build has three "if this breaks, everything breaks" days:

1. **Day 2** — Gemma 4 + ASR de-risk. If Telugu doesn't work, the demo language changes.
2. **Day 7** — Owner field test. If usability is bad, the polish day flips to a redesign.
3. **Day 10** — Video record. If the shoot misses, Day 11 becomes a second shoot day.

Everything else has slack.

## Anti-scope-creep rules for the 12 days

- No "small extra feature" gets added without dropping something else
- No backend rewrites after Day 6
- No design system changes after Day 8
- No new tool definitions after Day 5
- If a day runs over by >2h, cut something from the next day, do not absorb the slip
