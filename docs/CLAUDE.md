# CLAUDE.md — Execution Instructions for Claude Code

You are building **Saathi CRM**, a Gemma 4-powered PWA submission for the Kaggle Gemma 4 Good Hackathon. Solo developer, 12 days, deadline **2026-05-18**.

## Mission

Ship a working PWA that lets a Hyderabad car detailing shop owner add customers via Telugu voice + car photo, then send AI-drafted WhatsApp follow-ups with one tap. The demo must run end-to-end against a real Gemma 4 endpoint and send real WhatsApp messages.

## Read These First (in order)

1. `docs/PRD.md`
2. `docs/SPEC.md`
3. `docs/ARCHITECTURE.md`
4. `docs/WORKFLOWS.md`
5. `docs/GEMMA_INTEGRATION.md`
6. `docs/AI_AGENT_SPEC.md`
7. `docs/DATA_MODEL.md`
8. `docs/UI_UX_SPEC.md`
9. `docs/ANTI_SLOP.md` ← non-negotiable
10. `docs/TASKS.md`
11. `docs/TEST_PLAN.md`
12. `docs/DEMO_SCRIPT.md`

## Execution Style

- Spec-driven. Specs are the contract.
- Make sensible decisions and proceed. Do not ask trivial questions.
- Stop and ask only when a spec contradicts itself, or when an architectural choice would lock out a downstream requirement.

## Core Build Requirements

- Next.js App Router · TypeScript · Tailwind CSS
- Supabase (Postgres + Storage + RLS)
- PWA manifest, installable, offline shell
- iOS Safari is the primary target — test on Safari before Chrome
- Mobile-first, designed for 390px width
- Server-side Gemma 4 via adapter pattern (Ollama-backed, `gemma4:e4b` 8B)
- whisper.cpp + ggml-large-v3-turbo for Telugu/Hindi ASR (locked Day 2)
- Twilio WhatsApp Sandbox for sends (locked Day 1; provider abstraction lets V2 swap to Meta)
- Saathi Saffron design tokens (see `UI_UX_SPEC.md`)

## Strict Scope Control — Do NOT Build

- Authentication / user accounts (single-tenant for the pilot)
- Multi-shop / multi-tenant
- Admin dashboard
- Behavior analytics, retention dashboards, charts
- Customer-facing chatbot or QR landing
- Service catalogue or pricing recommendation engine
- Anything in the legacy DetailMate AI pack except the language switcher pattern, the booking-modal pattern (repurposed as confirmation modal), and the Tailwind setup
- Payment processing, scheduling UI, calendar integration
- Production-grade computer vision (license plate OCR is best-effort)

## AI Integration — Adapter Pattern

```
lib/ai/
  gemmaAdapter.ts      // production: Cloudflare Tunnel → Mac local Gemma 4
  modalAdapter.ts      // backup: Modal serverless endpoint
  mockAdapter.ts       // unit tests ONLY, never the demo default
  index.ts             // chooses based on env
```

Default `AI_MODE=local` for dev. `AI_MODE=mock` may exist but **must not be the production or demo default** — judges will check the repo and a mock-default loses the technical execution score.

## Anti-Slop Enforcement

Before any UI ships to the demo branch, verify against `ANTI_SLOP.md`. The big ones:

- No sparkles, no ✨, no "AI" badges in chrome
- No glassmorphism, gradients, glow effects
- No emojis in UI strings (one exception: flags in language switcher)
- No em dashes in product copy (use commas / short sentences)
- No assistant avatar, no chat-bubble persona
- Button labels are verbs, not pleasantries
- Function call traces are *visible* in demo mode (`?demo=1`)

## Deliverables Checklist (final state)

- [ ] Public GitHub repo, Apache 2.0
- [ ] Vercel deployment URL with HTTPS
- [ ] Demo flows work end-to-end on owner's iPhone
- [ ] Real Gemma 4 inference (not mock)
- [ ] Real WhatsApp send to a test number
- [ ] 60–90s demo video shot in the actual shop
- [ ] Owner testimonial clip (Telugu, with English subtitles)
- [ ] Technical write-up covering: architecture, Gemma 4 use, function calling, capability honesty, deployment cost, scale path
- [ ] README runnable in <10 minutes by a stranger
- [ ] No secrets in repo
- [ ] All 14 anti-slop rules pass

## When in Doubt

Ship the simpler thing. Polish over features. Reliability over surface area.
