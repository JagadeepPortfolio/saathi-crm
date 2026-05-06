# PRD — Saathi CRM

## Project

**Saathi** ("companion" in Hindi/Sanskrit-derived languages): a Gemma 4-powered CRM co-pilot for Indian MSMEs. Built for the Kaggle Gemma 4 Good Hackathon, Digital Equity track. Submission deadline **2026-05-18**.

## Pilot

A car detailing studio in Hyderabad. Owner-validated. Owner has agreed to be in the demo video.

## Problem

India has ~63M MSMEs (Micro/Small/Medium Enterprises). Most operate the entire business off the owner's phone. Customer relationship management is the most under-served software layer for them:

- They don't track which customers came in or what was done
- They forget to follow up; customers churn silently
- They have no behavioral signal — repeat vs first-time, high-spend vs price-shopper, served-recently vs lapsed
- Existing CRM tools (HubSpot, Zoho, Salesforce) are English-first, web-first, and priced for SaaS budgets MSMEs don't have
- WhatsApp is where customer relationships actually live, but it's an unstructured firehose

The owner of the pilot shop named this directly: *"we don't have any handy tool to track customers, retain them, send them WhatsApp messages, understand their behaviours."*

## Why Gemma 4 specifically

The pain has been visible for a decade; what's new is that an open-weights multimodal model with native function calling makes a phone-friendly, multilingual, offline-capable CRM viable for a single-shop owner with no per-seat SaaS budget. Saathi is built on Gemma 4 because:

- **Audio + vision input** lets the owner skip typing entirely (voice notes after each customer, photos for car identity)
- **Native function calling** maps voice notes to structured CRM operations (`customer.create`, `whatsapp.send_template`) without brittle regex parsing
- **Multilingual generation** lets every customer get a follow-up in *their* L1, drafted by the system but approved by the owner
- **Apache 2.0 + edge variants** mean the long-term unit economics scale to one shop = $0/month per shop, the only economics that work for MSMEs

## Target user

**Primary:** the shop owner (B2B). Hyderabad car detailing studio for the pilot, generalizes to kirana / tailor / salon / clinic / repair / catering for V2.

**Not the customer.** Customers receive WhatsApp messages; they never open Saathi.

## Product vision

The owner's phone becomes a customer-relationship co-pilot. After every customer, 10 seconds of voice + 1 photo creates a tracked record. Once a week, the owner taps three buttons and three lapsed customers receive a personalized Telugu WhatsApp message that doesn't sound like spam.

## MVP — two locked flows

### Flow 1 — Voice-photo customer intake

1. Owner taps **Record**
2. Owner speaks 5–20 seconds in Telugu/Hindi/English: *"Ramesh sir, blue Swift TS09EX1234, full ceramic detailing, 2500 paid, complained about wax smell, told him 2 months baad come back."*
3. Owner taps the camera button, takes a photo of the car (license plate visible)
4. Owner taps **Save**
5. Server: ASR → Gemma 4 (text + vision) → function call `customer.create` or `customer.update` → Supabase write
6. Confirmation screen shows the parsed structured record; owner can correct any field before commit

### Flow 2 — AI-drafted WhatsApp follow-up

1. Owner opens **Customers**, sees a "Lapsed" filter (no visit in 60+ days)
2. Owner taps a customer
3. Owner taps **Draft follow-up** in the customer's language (Telugu / Hindi / English)
4. Server: Gemma 4 reads visit history + last visit notes → drafts a non-spammy personalized message
5. Owner sees the draft in a textarea, edits if needed
6. Owner taps **Send**
7. Server: function call `whatsapp.send_template` → Meta WhatsApp Business Cloud API → message logged
8. Function call trace appears as a small log row in the UI in demo mode

## Non-Goals (MVP)

- No customer-facing surface; customers only interact via WhatsApp messages they receive
- No appointment scheduling / calendar UI
- No payment integration / invoicing
- No multi-shop / multi-owner accounts (single-tenant, hardcoded shop ID)
- No analytics dashboards or behavior charts
- No admin / settings UI beyond a simple language preference toggle
- No Telugu/Hindi *speech synthesis* (we generate text; owner reads it)
- No fully on-device Gemma (server-side only for MVP; on-device flagged as V2)

## Success criteria

- Owner uses Saathi unaided for one shift and adds 5+ customers
- Telugu voice intake produces structured records the owner reads as accurate ≥80% of the time
- AI-drafted Telugu WhatsApp messages are sent without owner edits ≥50% of the time, and with minor edits ≥90%
- One real customer responds positively to a Saathi-sent follow-up during the pilot
- Demo video runs end-to-end on the owner's iPhone in the actual shop
- Repo is buildable by a stranger in under 10 minutes

## Key message for the submission

*Affordable, multilingual, voice-first AI for the smallest businesses — in their language, on the phone they already own, with no app store and no SaaS subscription.*
