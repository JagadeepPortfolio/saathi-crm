# Submission Checklist — Saathi

> Steps a human must run to take Saathi from "code complete" to "submitted to Kaggle". Items marked ☐ are pending; ✅ are done.

## What's already done

- ✅ **Public GitHub repo** with Apache 2.0 LICENSE — https://github.com/JagadeepPortfolio/saathi-crm
- ✅ **All commits pushed** to `origin/main` (latest: YouTube URL added to the write-up)
- ✅ **Live landing deployed** at https://saathi-crm.vercel.app — full marketing page with embedded YouTube video, four screenshots, three Gemma 4 pillars, capability-honesty cards, pricing table, and a clone-and-run code block. Replaces the Day 1 placeholder
- ✅ **YouTube video live** at https://youtu.be/0w4-KMMX_6o — 90s, burned-in English subtitles
- ✅ **Kaggle Writeup body** drafted at `docs/KAGGLE_WRITEUP.md` (1,313 words — under the 1,500 cap with ~190 word buffer)
- ✅ **Kaggle cover image** at `docs/screenshots/cover.png` (560 × 280, the dimensions Kaggle expects)
- ✅ **Anti-slop sweep** clean (em-dash, emoji, banned-icon, generic-loading checks all empty)
- ✅ **Secrets scan** clean (no Twilio SIDs, Supabase keys, or generic tokens in tracked files)
- ✅ **README runnable in <10 minutes** with screenshots
- ✅ **90s demo video built** at `video/output/submission.mp4`, fully reproducible via `video/build.sh`
- ✅ **Real Gemma 4 function-call traces** visible in the video at shots 5 and 6
- ✅ **Real Twilio WhatsApp send infrastructure** wired (Sandbox; production swap is one env var)

---

## 1. Verify the YouTube video is "viewable without login" ☐

Kaggle requires: *"viewable by the judges without requiring a login"*.

Both **Unlisted** and **Public** satisfy that — anyone with the link can watch.
**Private** does NOT.

Open https://youtu.be/0w4-KMMX_6o in a **logged-out incognito window** and confirm the video plays. If a "Sign in" wall appears, the video is set to Private — flip it to Unlisted in YouTube Studio → Video → Visibility.

## 2. Create the Kaggle Writeup ☐

Go to your competition's Writeups section and click **New Writeup**.

### 2a. Title and subtitle

| Field | Value |
|---|---|
| Title | `Saathi — Voice-first CRM for Indian MSMEs, built on Gemma 4` |
| Subtitle | `A 10-second Telugu voice note becomes a tracked customer plus an AI-drafted WhatsApp follow-up. Apache 2.0. $0 per shop, per month.` |

### 2b. Body

Open `docs/KAGGLE_WRITEUP.md` in your editor and **copy everything from the first `## The problem` heading to the end of the file**. Paste into the Kaggle Writeup body. Skip the title/subtitle and the top "Links" block — Kaggle has dedicated fields for those.

Word count: 1,313 raw / 1,124 prose. Safely under 1,500.

### 2c. Select Track

Track: **Digital Equity** (primary). If Kaggle lets you select a secondary, pick **Inclusion** or **Future of Education**.

### 2d. Media Gallery

Two things to attach:

1. **Cover image (required)** — upload `docs/screenshots/cover.png` (560 × 280, Saathi-branded)
2. **Demo video** — paste the YouTube URL `https://youtu.be/0w4-KMMX_6o` into the video attachment field. Kaggle will embed it.

### 2e. Project Links (Attachments → Project Links section)

| Link Label | URL |
|---|---|
| Code Repository | `https://github.com/JagadeepPortfolio/saathi-crm` |
| Live Demo | `https://saathi-crm.vercel.app` |
| Long technical write-up | `https://github.com/JagadeepPortfolio/saathi-crm/blob/main/docs/SUBMISSION.md` |

### 2f. Save

Click **Save**. Kaggle saves the Writeup as a draft. You'll see the "Submit" button appear in the top-right corner.

## 3. Hit Submit ☐

Click the **Submit** button (top-right of the Writeup view).

Each team gets one Writeup, but you can un-submit, edit, and re-submit as many times as you want before the deadline. So submit early, polish later.

## 4. Post-submit verification ☐

Open every URL in a **logged-out incognito tab**. All must load:

- Repo lands at the README with screenshots — https://github.com/JagadeepPortfolio/saathi-crm
- Live demo lands on the Saathi landing page with the video embed — https://saathi-crm.vercel.app
- YouTube plays without login — https://youtu.be/0w4-KMMX_6o
- Long write-up loads on GitHub — https://github.com/JagadeepPortfolio/saathi-crm/blob/main/docs/SUBMISSION.md
- The Kaggle Writeup itself appears in the competition's Writeups list

## 5. Optional: announce ☐

Twitter / LinkedIn post. Impact-track judges sometimes scan social. Suggested:

```
Shipped Saathi for the Gemma 4 Good Hackathon —
a voice-first CRM for Indian MSMEs, in Telugu, on the
owner's phone, built on Gemma 4 (gemma4:e4b, 8B).

10s Telugu voice → tracked customer.
One tap → AI-drafted Telugu WhatsApp.
$0/shop/month. Apache 2.0.

https://youtu.be/0w4-KMMX_6o
https://github.com/JagadeepPortfolio/saathi-crm
```

---

## Pre-submission sanity replay

Run these once before clicking Submit:

```bash
cd /Users/jaggu/Desktop/Gemma4/saathi-crm
git status                                                          # → clean
git log --oneline -3                                                # → see recent commits on origin/main
curl -sI https://saathi-crm.vercel.app | head -1                    # → HTTP/2 200
curl -s https://saathi-crm.vercel.app | grep -oE "Voice-first CRM"  # → "Voice-first CRM"
open video/output/submission.mp4                                    # → plays 90s with subtitles
wc -w docs/KAGGLE_WRITEUP.md                                        # → ~1313
sips -g pixelWidth -g pixelHeight docs/screenshots/cover.png        # → 560 x 280
```

If all seven pass, ship it.
