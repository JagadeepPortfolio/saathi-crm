# Workflows — Saathi CRM

Two flows. Nothing else in the MVP. Every other "feature idea" is V2.

---

## Flow 1 — Voice-photo customer intake

### Happy path

1. Owner opens Saathi on iPhone Safari (already added to home screen)
2. Lands on **Today**. Taps the marigold **Record** button at the bottom
3. Full-screen Record view. Owner taps mic, speaks 5–20 seconds in Telugu / Hindi / English
4. On stop: live transcript appears (from IndicConformer streaming or post-stop), owner can re-record if it looks wrong
5. Owner taps **Add Photo** → native iOS camera opens via `<input capture="environment">`
6. Owner photographs the car (license plate visible if possible)
7. Owner taps **Save**. PWA POSTs `multipart/form-data` to `/api/intake`:
   - `audio` (webm / m4a)
   - `photo` (jpg, ≤1280px)
   - `transcript_hint` (client-side ASR if any; optional)
   - `language` (UI-selected)
8. Server pipeline:
   1. Save audio + photo to Supabase Storage (private buckets)
   2. ASR audio → IndicConformer → `{text, detected_language}`
   3. Fetch known customers (last 30 days, last 200 records) for dedup context
   4. Call Gemma 4 with intake system prompt + tools `customer.search`, `customer.create`, `customer.update`
   5. Execute the returned tool call against Supabase
   6. Return the resulting record + raw transcript + tool-call metadata
9. PWA shows confirmation: parsed name, car, services, amount, notes — each editable inline
10. Owner taps **Confirm**. Done. Returns to Today.

### Edge cases & failure modes

- **Mic permission denied:** show explainer, link to iOS Settings → Safari → Microphone, no other path
- **Audio empty / very short:** server returns `{error: "too_short"}`, UI says "Try again, speak for at least 3 seconds"
- **ASR confidence low:** confirmation screen highlights uncertain fields with a dotted underline, owner edits
- **Photo missing or unreadable plate:** intake still proceeds. Plate field empty, owner can fill in confirmation screen
- **Duplicate detection ambiguous:** Gemma 4 calls `customer.search` first; if multiple matches, intake API returns a "did you mean?" picker before final write
- **Gemma endpoint down:** adapter falls back to Modal endpoint. UI shows "Saving... (using backup)" without going to the backend swap
- **All AI down:** intake still saves the audio + photo + raw transcript. A "Needs review" pile collects them; owner can re-process when AI is back

### Demo-mode visibility

When `?demo=1`:
- Step 8 substeps render as a small log row: `ASR (1.2s) → Gemma 4 (4.1s) → customer.create → Supabase`
- The actual tool-call JSON is collapsible inline

---

## Flow 2 — AI-drafted WhatsApp follow-up

### Happy path

1. Owner opens **Customers** from the bottom nav
2. Taps the **Lapsed** filter chip → list of customers with `last_visit_at > 60d`
3. Taps one customer (e.g., Ramesh)
4. Customer Detail loads: summary card + visit history
5. Owner taps **Draft follow-up** at the bottom
6. Draft Review modal opens; defaults to customer's `preferred_language` (e.g., `te`)
7. PWA POSTs to `/api/draft` with `{customerId, language: 'te', occasion: 'lapsed'}`
8. Server pipeline:
   1. Load customer + last 3 visits + most recent message history
   2. Call Gemma 4 with follow-up system prompt + tools `whatsapp.send_text`, `whatsapp.send_template`
   3. Gemma 4 returns *the tool call to fire*, but server **does not fire it yet** — it returns the proposed tool call to the PWA for owner approval
9. PWA shows the drafted message in a textarea, pre-filled. Owner can edit
10. Below the textarea: a small log row showing the tool call about to fire (`whatsapp.send_template → +91 9XXX...`)
11. Owner taps **Send**. PWA POSTs to `/api/send` with `{customerId, text, language, templateName?}`
12. Server fires the WhatsApp Business Cloud API call, logs the message to `messages` table with `status: sent`
13. Webhook later updates status to `delivered` / `read`
14. Customer Detail refreshes; new outbound message visible in history

### Edge cases & failure modes

- **24-hour window check:** if last inbound from this customer is >24h, default to `whatsapp.send_template`. If within 24h, allow `whatsapp.send_text`. Server enforces this regardless of what Gemma 4 chose
- **Phone number missing:** disable **Draft follow-up** button, show inline message asking owner to add phone first
- **Owner edits draft heavily:** still go through `/api/send` with the edited text; if a template was originally chosen but the text is now custom, switch to `send_text` if within window, or to `send_template` with the edited text as a single variable
- **WhatsApp send fails (Meta error):** show error inline with retry. Log failure
- **Template not approved (Meta):** fall back to `send_text` if within window, else surface the error and ask owner to wait or message later
- **Telugu draft reads wrong:** owner edits in textarea before sending; this is the entire point of the approval step

### Demo-mode visibility

When `?demo=1`:
- The draft generation render a log line: `Gemma 4 (3.8s) → whatsapp.send_template proposed`
- After send: `Meta WhatsApp API (210ms) → message_id: wamid.HBgL...`

---

## Cross-cutting

### What never happens automatically without owner approval

- A WhatsApp message is never sent without an explicit owner tap on **Send**
- A customer record write happens automatically on intake (after ASR + Gemma parse), but an "edit before confirm" step is always presented and owner can reject the parse

### Audit trail

Every AI-mediated action stores `ai_tool_call_meta`:
```json
{
  "model": "gemma-4-<variant>",
  "input_tokens": 412,
  "output_tokens": 87,
  "ms": 4210,
  "tool": "customer.create",
  "approved_by": "owner"
}
```

This is the source for the demo-mode log rows and the technical write-up's evidence section.
