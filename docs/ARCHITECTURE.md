# Architecture — Saathi CRM

## Style

Hackathon-grade architecture: simple, swappable, demo-reliable. Three components cleanly separated: the PWA frontend, the AI inference plane (Gemma 4 + ASR), and the data + messaging plane (Supabase + WhatsApp).

## Component diagram

```
┌──────────────────────────────────────────────┐
│  iOS Safari PWA  (owner's iPhone)            │
│  - Today / Customers / Detail / Record       │
│  - getUserMedia mic, file-input camera       │
└───────────────┬──────────────────────────────┘
                │ HTTPS (Vercel)
┌───────────────▼──────────────────────────────┐
│  Next.js App Router — Vercel                 │
│  /api/intake     /api/customers              │
│  /api/draft      /api/send                   │
│  /api/whatsapp/webhook                       │
└───────┬───────────────────┬───────────────┬──┘
        │                   │               │
        │ ASR               │ Gemma 4       │ DB / Files
        │                   │               │
┌───────▼─────┐  ┌──────────▼──────────┐  ┌─▼────────┐
│ Indic-      │  │ Gemma 4 Endpoint    │  │ Supabase │
│ Conformer   │  │ (CF Tunnel → Mac    │  │ Postgres │
│  - HF or    │  │  local llama.cpp)   │  │ Storage  │
│    local    │  │ Modal/RunPod backup │  │ RLS      │
└─────────────┘  └─────────┬───────────┘  └──────────┘
                           │ tool calls
                ┌──────────▼──────────┐
                │ Meta WhatsApp       │
                │ Business Cloud API  │
                └─────────────────────┘
```

## Folder structure

```
saathi-crm/
├── app/
│   ├── (owner)/
│   │   ├── page.tsx              # Today
│   │   ├── customers/
│   │   │   ├── page.tsx          # list
│   │   │   └── [id]/page.tsx     # detail
│   │   └── record/page.tsx       # full-screen record
│   ├── api/
│   │   ├── intake/route.ts
│   │   ├── customers/route.ts
│   │   ├── customers/[id]/route.ts
│   │   ├── draft/route.ts
│   │   ├── send/route.ts
│   │   └── whatsapp/webhook/route.ts
│   ├── manifest.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── BottomBar.tsx
│   ├── CustomerRow.tsx
│   ├── DraftReview.tsx
│   ├── LangSwitcher.tsx
│   ├── MicCapture.tsx
│   ├── PhotoCapture.tsx
│   └── ToolCallLog.tsx
├── lib/
│   ├── ai/
│   │   ├── adapter.ts            # interface
│   │   ├── gemmaAdapter.ts       # default (CF tunnel)
│   │   ├── modalAdapter.ts       # backup
│   │   ├── mockAdapter.ts        # tests only
│   │   ├── prompts.ts
│   │   ├── tools.ts              # function-call schemas
│   │   └── index.ts              # adapter selector
│   ├── asr/
│   │   ├── indicConformer.ts
│   │   └── index.ts
│   ├── db/
│   │   ├── client.ts             # supabase
│   │   ├── customers.ts
│   │   ├── visits.ts
│   │   └── messages.ts
│   ├── whatsapp/
│   │   ├── client.ts
│   │   └── templates.ts
│   ├── i18n/
│   │   ├── en.ts
│   │   ├── hi.ts
│   │   └── te.ts
│   └── types.ts
├── public/
│   ├── icons/                    # PWA icons
│   └── demo/
├── supabase/
│   ├── schema.sql
│   ├── policies.sql
│   └── seed.sql
├── docs/
│   └── (this artifact pack)
├── .env.example
├── README.md
├── LICENSE                       # Apache 2.0
├── next.config.js
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## AI adapter pattern

```ts
// lib/ai/adapter.ts
export interface AIAdapter {
  parseIntake(input: ParseIntakeInput): Promise<ParseIntakeResult>;
  draftFollowup(input: DraftFollowupInput): Promise<DraftFollowupResult>;
}
```

Three implementations:

1. `gemmaAdapter.ts` — POSTs to the Gemma 4 endpoint exposed via Cloudflare Tunnel from the dev's Mac. Uses native function calling. **Default.**
2. `modalAdapter.ts` — Backup if the Mac is offline during the demo. Same wire format.
3. `mockAdapter.ts` — Returns canned responses for unit tests. **Never the demo default.**

`AI_MODE` env var picks one. Production deploy (Vercel) targets `gemma` (CF tunnel URL) with `modal` as a runtime fallback if the primary fails.

## Data layer (Supabase)

Single-tenant for the pilot — every row carries `shop_id` and the seed inserts one shop. RLS is still on so we don't have to rip it back out for V2.

Tables: `shops`, `customers`, `cars`, `visits`, `messages`, `follow_ups`. Schema in `supabase/schema.sql`. See `DATA_MODEL.md`.

Storage buckets: `intake-photos` (private, RLS-scoped), `intake-audio` (private, 7-day TTL).

## API routes

| Route | Method | Purpose |
|---|---|---|
| `/api/intake` | POST | Multipart: audio + optional photo → parsed customer record |
| `/api/customers` | GET | List with filter / search |
| `/api/customers/[id]` | GET / PATCH | Detail / edit |
| `/api/draft` | POST | Body: `{customerId, language}` → drafted message text |
| `/api/send` | POST | Body: `{customerId, text}` → fires WhatsApp send |
| `/api/whatsapp/webhook` | POST | Meta delivery callbacks |

## Deployment

- **Frontend:** Vercel free tier, custom domain optional
- **DB / Storage:** Supabase free tier
- **Gemma 4 inference (primary):** Mac M-series running llama.cpp / MLC, exposed via Cloudflare Tunnel. Free.
- **Gemma 4 inference (backup):** Modal serverless GPU. ~$0.30–0.50/hr active, $0 idle. Budget: $20 for the hackathon period.
- **ASR:** AI4Bharat IndicConformer, either self-hosted on the same Mac or via Hugging Face Inference (free tier sufficient for demo volume)
- **WhatsApp:** Meta WhatsApp Business Cloud API. Free dev test number + 1,000 free conversations/month. Sufficient.

## Security & privacy

- No customer auth (single-tenant, owner-only access; pilot URL is unguessable + behind a simple owner passcode if exposed)
- No third-party analytics
- Supabase RLS enforced on every table
- Customer photos private bucket only
- Audio files auto-deleted after 7 days
- WhatsApp tokens server-side only, never exposed to client
- No PII in logs; logs scrub phone numbers and plate text

## Demo mode

`?demo=1` query param enables visible tool-call traces, latency timings, and the *Saathi → Gemma 4 → WhatsApp* pipeline log shown to judges. Disabled by default in the deployed PWA.
