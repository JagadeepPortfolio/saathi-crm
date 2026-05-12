# Test Plan — Saathi CRM

Three layers: Day 2 de-risk gates, per-flow smoke tests, pre-demo rehearsal.

## Day 2 de-risk gates (acceptance for the build to continue)

Run these as scripted tests with logged outputs in `docs/day2-evidence.md`.

### Gate 1 — Telugu ASR

Input: `samples/ramesh_te.m4a` (8 seconds, you record this; one customer's worth of detail).

Expected: IndicConformer returns transcript that matches the audio ≥80% by word, language tag = `te`.

Pass: human reads transcript, agrees it captures the meaning even if a few words are wrong.
Fail: try IndicConformer-Large; if still bad, try Whisper-large + Telugu hint; if both fail, accept Hindi-only or English-only demo.

### Gate 2 — Gemma 4 vision + JSON

Input: the Gate 1 transcript + `samples/swift.jpg` (a real car photo with plate visible).

Expected: Gemma 4 with `customer.create` tool returns valid JSON, name extracted, language=`te`, plate matches photo.

Pass: JSON parses; `name` is non-empty; `services` has ≥1 entry; `amount_inr` matches transcript.
Fail: try a larger Gemma 4 variant. If the largest fits-on-Mac variant fails, switch to Modal-hosted larger variant.

### Gate 3 — Telugu generation quality

Prompt Gemma 4 to write a 3-sentence Telugu follow-up for "Ramesh, blue Swift, last visit 75 days ago, full ceramic detailing".

Expected: output reads naturally to a Telugu speaker (the owner over WhatsApp, or a Telugu-speaking friend).

Pass: native speaker says "I would send this without rewriting" or "small edits, mostly fine".
Fail: try larger variant. If still poor, demo in Hindi (Hindi quality is typically much better than Telugu in small models).

### Gate 4 — End-to-end latency

Run Gates 1–2 sequentially, measure wall-clock from audio submitted to JSON returned.

Expected: ≤8s on a warm pipeline.

Pass: ≤8s consistent across 3 runs.
Fail: ≤15s acceptable for demo if quality is good. >15s requires a faster variant or Modal.

## Per-flow smoke tests

Run before the owner field test (Day 7) and again after Day 9 reliability work.

### Flow 1 — intake

| # | Step | Expected |
|---|---|---|
| 1.1 | Open Saathi in Safari at the 390 px responsive viewport | Today screen, Saathi mark, language switcher, Record button visible |
| 1.2 | Tap Record | Mic permission prompt (first time only) |
| 1.3 | Speak 6s Telugu clip | Live waveform, timer increments |
| 1.4 | Tap stop | "Transcribing Telugu..." status, then transcript appears |
| 1.5 | Tap Add Photo | File picker opens (camera on a device, file chooser on desktop) |
| 1.6 | Capture car | Thumbnail appears, Save button enabled |
| 1.7 | Tap Save | Status walks: Saving audio → Transcribing → Parsing → Saved |
| 1.8 | Confirmation screen shows parsed fields | Name, plate, services, amount, notes — all populated, all editable |
| 1.9 | Tap Confirm | Returns to Today, new customer at top of Recent list |
| 1.10 | Refresh page | Customer persists (DB write succeeded) |

### Flow 2 — follow-up

| # | Step | Expected |
|---|---|---|
| 2.1 | Open Customers tab | List with search + filter chips |
| 2.2 | Tap Lapsed filter | List filters to customers with last_visit > 60d |
| 2.3 | Tap a customer | Customer Detail loads, summary + visits + messages |
| 2.4 | Tap Draft follow-up | Draft Review modal, language defaults to customer's preferred |
| 2.5 | Wait for draft | "Reading visit history... Drafting in Telugu... Ready" |
| 2.6 | Draft text appears in textarea | Personalized to this customer (mentions car or last service) |
| 2.7 | Edit a word | Textarea is editable |
| 2.8 | Tap Send | "Sending to WhatsApp... Sent" |
| 2.9 | Real WhatsApp message arrives on the test customer's phone | Telugu text matches the textarea |
| 2.10 | Customer Detail refreshes | New outbound message visible at the top of Messages |
| 2.11 | Webhook delivery callback | Message status updates to delivered (and read if customer opens) |

### Multilingual smoke

For each language EN / HI / TE:
- UI chrome renders in that language (header, buttons, filter chips)
- A draft can be generated in that language
- Telugu/Hindi UI strings are hand-reviewed (no LLM-translation tells)

### Demo-mode smoke

With `?demo=1`:
- Tool-call log row visible during intake (`ASR (Xs) → Gemma 4 (Xs) → customer.create → Supabase`)
- Tool-call log row visible during draft (`Gemma 4 (Xs) → whatsapp.send_template proposed`)
- Tool-call log row visible during send (`Meta WhatsApp API (Xms) → wamid.HBgL...`)

Without `?demo=1`:
- No log rows anywhere

## Edge cases

| Case | Expected |
|---|---|
| Mic permission denied | Explainer + iOS Settings deep-link, no other action available |
| Audio <3s | "Try again, speak for at least 3 seconds" |
| Empty transcript (silence) | Same as above |
| Photo missing | Save still works; plate field empty in confirmation |
| Photo plate unreadable | Plate field empty; owner edits |
| Duplicate customer detected (same plate) | "Did you mean Ramesh / TS09EX1234?" picker |
| Customer phone missing | Draft follow-up button disabled with inline message |
| Lapsed customer template not approved | Falls back to send_text if within 24h, else error with retry |
| Mac Gemma server down | Adapter falls back to Modal silently; UI shows "Sending... (using backup)" |
| Both Gemma endpoints down | Clear error, retry button, audio + photo still saved as "needs review" |
| Network offline mid-flow | Service worker queues the send; fires on reconnect |
| iOS Safari mic codec quirks | Server accepts both webm and mp4/m4a |

## Owner field validation protocol (Day 7)

Developer drives the laptop. Owner reads the parsed records and Telugu drafts aloud and rates each.

**Watch for:**
- After the owner speaks the Telugu voice note, did the parsed record match what he said?
- Did the Telugu draft sound natural to him? Did he edit it before sending?
- Did the real customer respond to the WhatsApp message?
- Where did the owner pause or frown? That's the prompt-engineering signal.

**Capture before leaving:**
- Owner-to-camera Telugu testimonial (~12s)
- 25-second Telugu voice note by the owner (the audio that plays in shot #3 of the demo video)
- B-roll: shop wide, owner hands on car, real customer car (with permission), WhatsApp arrival on the owner's phone

**Same-evening fix list:**
1. Top 3 things that misparsed or were rewritten — fix before Day 8 polish starts.

## Pre-demo rehearsal (Day 10 morning, before video shoot)

Run the full demo path end-to-end in Mac Safari at the 390 px viewport three times in a row, with `?demo=1`:

1. Add a fresh customer via voice + photo (uploading the photo file captured at the shop)
2. Open a lapsed customer (use the seed data with last_visit_at backdated)
3. Draft, edit, send
4. Verify WhatsApp arrival on the second phone
5. Verify all tool-call traces appear

If any of the three runs has a glitch, fix before shooting.

## Submission rehearsal (Day 12 morning)

- Open the deployed PWA URL from a fresh browser (incognito)
- Open the GitHub repo URL from logged-out browser
- Open the YouTube video URL from logged-out browser
- All three load in <5s and show what's expected

If any link fails, fix before submitting.
