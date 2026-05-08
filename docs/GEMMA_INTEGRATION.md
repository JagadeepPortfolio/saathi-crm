# Gemma 4 Integration — Saathi CRM

## Goal

Use Gemma 4 as the reasoning + generation core for two operations: parsing voice-and-photo customer intake into a structured CRM record, and drafting language-appropriate WhatsApp follow-ups. Both operations must use **native function calling** (visible tool calls), and the multimodal path must be real (text + image; audio path is via IndicConformer ASR upstream).

## Capability honesty (non-negotiable in the write-up)

- **Vision (license plates, car make/model, damage):** likely solid on Gemma 4 small variants — Gemma 3 + PaliGemma lineage suggest reliability here. Test on Day 2.
- **Text reasoning + JSON / function calling:** Gemma 4's pitch — should be solid even at 4–9B.
- **Telugu generation quality:** the uncertain piece. Hand-test on Day 2 with the largest Mac-local variant. If quality is below "owner reads it without rewriting" 50% of the time, swap up to a larger variant or fall back to Modal-hosted larger model.
- **Telugu audio understanding directly via Gemma 4 audio:** treated as bonus, not core. Primary ASR path is **IndicConformer** because it has years of Indic optimization. This is *correct engineering*, not a workaround — the write-up frames it that way.

## Model variant selection

Decision made on Day 2 based on actual benchmarks. Defaults:

- **Dev iteration on Mac:** smallest Gemma 4 variant that passes the Day 2 acceptance gate (Telugu generation reads naturally to the owner). Quantized Q4_K_M.
- **Demo target:** the variant that fits in the dev Mac's RAM at ≤8s end-to-end latency for draft generation. Empirical, not chosen in advance.
- **Backup (Modal):** one size larger if the local variant feels marginal.

Spec is variant-agnostic. `GEMMA_MODEL=` env var selects, adapter is unchanged.

## Inference deployment paths

### Primary: Mac-local + Cloudflare Tunnel

```
Mac M-series → llama.cpp (or MLC) HTTP server on :8080
            ↓
Cloudflare Tunnel → public HTTPS URL
            ↓
Vercel Next.js server-side fetch
```

**Pros:** $0, fast iteration, full control, no rate limits.
**Cons:** Mac must be on during demo. Mitigation: Modal backup endpoint, env-var swap takes 30s.

### Backup: Modal serverless GPU

Deployed as a Modal function with the same HTTP contract. Cold start 15–30s, warm <1s. Budget: $20 for the hackathon.

### Local dev shortcut

When iterating on prompts only (not architecture), `MOCK=1` returns canned responses from `mockAdapter.ts`. Unit tests only. **Never the demo default.**

## HTTP contract for the Gemma endpoint

Single endpoint `POST /generate`, OpenAI-style messages format with tool calling:

### Request

```json
{
  "messages": [
    {"role": "system", "content": "<system prompt from prompts.ts>"},
    {"role": "user", "content": [
      {"type": "text", "text": "<owner transcript + context>"},
      {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64,..."}}
    ]}
  ],
  "tools": [<tool schemas from tools.ts>],
  "tool_choice": "auto",
  "temperature": 0.2,
  "max_tokens": 800
}
```

### Response

```json
{
  "model": "gemma-4-<variant>",
  "tool_calls": [
    {
      "id": "call_1",
      "function": {
        "name": "customer.create",
        "arguments": "{ \"name\": \"Ramesh\", \"language\": \"te\", ... }"
      }
    }
  ],
  "usage": {"input_tokens": 412, "output_tokens": 87, "ms": 4210}
}
```

## Tool definitions (summary; full JSON schemas in `AI_AGENT_SPEC.md`)

| Tool | Purpose | Used in flow |
|---|---|---|
| `customer.search` | Find existing customer by phone or plate | Intake (dedup) |
| `customer.create` | Create new customer record | Intake (new customer) |
| `customer.update` | Append visit / update fields | Intake (returning customer) |
| `whatsapp.send_text` | Send free-form message in 24h session window | Follow-up (recent customer) |
| `whatsapp.send_template` | Send a pre-approved template (out-of-window) | Follow-up (lapsed customer) |

The system prompt for Flow 1 lists `customer.*` tools. The system prompt for Flow 2 lists `whatsapp.*` tools. Scoping the tool list per flow reduces hallucination.

## ASR — whisper.cpp + ggml-large-v3-turbo (locked Day 2)

**Decision (locked Day 2 — see commit "Day 2 de-risk"):** server-side ASR via whisper.cpp running `ggml-large-v3-turbo` (1.5GB), not IndicConformer. Why this beat the original plan:

- Gemma 4's native audio path through Ollama 0.20.2 was unreliable — silently hallucinated generic Telugu greetings instead of transcribing. Capability declared, API not wired through.
- whisper-large-v3-turbo gave **~85% WER on a real Telugu/English code-mixed clip** with the license plate transcribed perfectly.
- `brew install whisper-cpp ffmpeg` plus a model download is under 5 minutes total. No HF auth wall, no rate limits, fully offline.

Pipeline:

```
audio (m4a/webm) → ffmpeg (16kHz mono WAV) → whisper-cli -l <te|hi|en> → transcript
```

Implementation: `lib/asr/whisper.ts` spawns `whisper-cli` and `ffmpeg` as subprocesses. Public function `transcribe({audioBytes, language})` returns `{text, language, ms}`. Same Mac runs Ollama and whisper-cli; the Cloudflare Tunnel exposes a thin Next.js endpoint that calls both internally.

## CRITICAL Ollama flag for Gemma 4: `think: false`

Every request from `gemmaAdapter.ts` sets `think: false` at the top level of the request body. Without it, Gemma 4 emits a long reasoning trace into a `thinking` field and burns the `num_predict` budget before producing the actual `tool_calls` — making the model look broken when it's actually just verbose. Confirmed empirically on Day 2.

## Multimodal — vision

Photo path:
1. PWA compresses to 1280px max edge, JPEG quality 0.85
2. POST to `/api/intake` as multipart
3. Server base64-encodes, includes in Gemma 4 messages array as `image_url`
4. Gemma 4 sees the photo *and* the transcript in the same context
5. Tool call enriched with extracted fields: license plate, car make/model/color (best-effort)

License plate extraction is best-effort. If unreadable, the tool call still proceeds with whatever Gemma 4 produced; owner edits in the confirmation screen.

## Adapter interface

```ts
// lib/ai/adapter.ts
export interface AIAdapter {
  parseIntake(input: {
    transcript: string;
    photoBase64?: string;
    language: 'en' | 'hi' | 'te';
    knownCustomers: CustomerSummary[]; // for dedup context
  }): Promise<{
    toolCall: ParsedToolCall;
    rawResponse: GemmaResponse;
  }>;

  draftFollowup(input: {
    customer: Customer;
    visits: Visit[];
    targetLanguage: 'en' | 'hi' | 'te';
    occasion?: 'lapsed' | 'thankyou' | 'reminder';
  }): Promise<{
    text: string;
    rawResponse: GemmaResponse;
  }>;
}
```

## Honest framing for the technical write-up

Lead with this paragraph:

> Saathi runs Gemma 4 server-side, exposed to the PWA via a single Next.js endpoint. We chose server-side over on-device because (a) the pilot owner uses iOS, where on-device LLM inference is currently impractical for solo-dev timelines, and (b) PWA delivery — no install, no app store — is itself the digital-equity wedge for Indian MSMEs, who avoid app installs aggressively. Multimodal input is real: vision on car photos, audio routed through AI4Bharat IndicConformer (a purpose-built Indic ASR) before reaching Gemma 4. Function calling is native to Gemma 4 and visible to judges in the demo (`?demo=1`). On-device Gemma 4 in WebGPU/MLC is on the V2 roadmap, not the MVP claim.

This honesty *strengthens* the technical execution score, not weakens it. Judges reward correctly-scoped engineering over over-claimed scope.
