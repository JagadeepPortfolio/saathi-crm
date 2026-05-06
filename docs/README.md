# Saathi CRM — Claude Code Artifact Pack

This folder contains the complete spec-driven artifact pack for building **Saathi**, a Gemma 4-powered CRM co-pilot for Indian MSMEs. Pilot is a car detailing studio in Hyderabad. Built for the Kaggle **Gemma 4 Good Hackathon** (Digital Equity track), submission deadline **2026-05-18**.

## What this product is, in one sentence

A phone-first PWA where a small business owner records a 10-second voice note about a customer (in Telugu, Hindi, or English), shows a photo of the car, and Saathi turns it into a tracked customer record plus a draft WhatsApp follow-up the owner can approve and send with one tap.

## What this product is *not*

Not a customer-facing chatbot. Not a service catalogue / education tool. Not a "QR code at the counter" experience. The user is the **shop owner**, not the shop's customer.

## Use with Claude Code

1. Create a new project folder, e.g. `saathi-crm/`.
2. Copy these files into `saathi-crm/docs/`.
3. Open the project in Claude Code.
4. Paste `CLAUDE.md` contents into the first prompt.
5. Execute phase by phase from `TASKS.md`.

### Recommended first prompt

```text
Read CLAUDE.md and all referenced specs in docs/. Build Saathi CRM exactly
as specified. Stack: Next.js App Router + TypeScript + Tailwind + Supabase.
Server-side Gemma 4 endpoint via adapter. Mock adapter is for unit tests
only, never for the demo. Execute Day 1 of TASKS.md and stop.
```

## Read order for humans

1. `PRD.md` — what we're building and why
2. `SPEC.md` — functional spec
3. `ARCHITECTURE.md` — system architecture
4. `WORKFLOWS.md` — the two locked flows step-by-step
5. `GEMMA_INTEGRATION.md` — Gemma 4 endpoint, ASR, function calling
6. `AI_AGENT_SPEC.md` — system prompts, tool JSON schemas
7. `DATA_MODEL.md` — types and Supabase schema
8. `UI_UX_SPEC.md` — Saathi Saffron tokens, layouts, components
9. `ANTI_SLOP.md` — UI/UX guardrails (read before any pixel ships)
10. `DEMO_SCRIPT.md` — 60–90 second submission video
11. `TASKS.md` — day-by-day for May 6–18
12. `TEST_PLAN.md` — de-risk tests, smoke tests, owner field test

## Hackathon submission summary

| | |
|---|---|
| Track | Digital Equity (primary), Future of Education (secondary fit) |
| Deadline | 2026-05-18 |
| Submission artifacts | working PWA · public GitHub repo · technical write-up · 60–90s video |
| Judging | impact · technical execution · communication |
| Pilot venue | Car detailing studio, Hyderabad |
| Owner phone | iPhone (iOS Safari PWA) |
