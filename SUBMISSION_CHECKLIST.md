# Submission Checklist — Saathi

> Steps a human must run to take Saathi from "code complete" to "submitted to Kaggle". Marked ☐ if pending.

## 1. Push the final commit ☐

The working tree on the dev Mac contains the full video build pipeline, the
final 90-second video, README screenshots, and the submission checklist. None
of this has been pushed to GitHub yet.

```bash
git push origin main
```

Confirm: `git status` shows "Your branch is up to date with 'origin/main'."

## 2. Make the GitHub repo public ☐

The repo is currently **private**. Judges cannot read a private repo.

```bash
gh repo edit JagadeepPortfolio/saathi-crm --visibility public --accept-visibility-change-consequences
```

Confirm at https://github.com/JagadeepPortfolio/saathi-crm — opens in a logged-out browser without "404".

Optional, recommended: add topics for discoverability.

```bash
gh repo edit JagadeepPortfolio/saathi-crm \
  --add-topic gemma --add-topic gemma-4 --add-topic crm \
  --add-topic pwa --add-topic whatsapp --add-topic kaggle-hackathon \
  --add-topic indian-msme --add-topic digital-equity
```

## 3. Upload the demo video to YouTube ☐

The video is at `video/output/submission.mp4` (90.2s, 3.3 MB, H.264/AAC, 1080p).

1. Go to https://studio.youtube.com → **CREATE → Upload videos**
2. Drag in `video/output/submission.mp4`
3. **Title:** `Saathi — Voice-first CRM for Indian MSMEs, built on Gemma 4`
4. **Description:**
   ```
   Saathi is a voice-first CRM co-pilot for Indian small businesses, built on
   Gemma 4 (gemma4:e4b, 8B). The owner records a 10-second Telugu voice note,
   photographs the customer's car, and Saathi turns it into a tracked customer
   plus an AI-drafted WhatsApp follow-up — approved and sent in one tap.

   Submitted to the Kaggle Gemma 4 Good Hackathon — Digital Equity track.

   Repo: https://github.com/JagadeepPortfolio/saathi-crm
   Write-up: https://github.com/JagadeepPortfolio/saathi-crm/blob/main/docs/SUBMISSION.md
   License: Apache 2.0
   ```
5. **Visibility:** Unlisted (judges access via link; not public)
6. **Audience:** "No, it's not made for kids"
7. Save. Copy the share URL.

## 4. Update SUBMISSION.md with the YouTube URL ☐

In `docs/SUBMISSION.md`, replace the line:

```
| Demo video (YouTube unlisted) | _filled in at submission time — see `SUBMISSION_CHECKLIST.md`_ |
```

with the actual URL, then:

```bash
git add docs/SUBMISSION.md
git commit -m "Add YouTube demo URL to submission write-up"
git push
```

## 5. Submit to Kaggle ☐

Submission form: https://www.kaggle.com/competitions/google-gemma-3n-impact-challenge/submit  
(replace with the correct path if the URL has changed)

Fields you'll fill:

| Field | Value |
|---|---|
| Project title | **Saathi — Voice-first CRM for Indian MSMEs** |
| Track | **Digital Equity** (primary). Secondary fit: Future of Education / Inclusion |
| Public GitHub URL | https://github.com/JagadeepPortfolio/saathi-crm |
| Video URL | The unlisted YouTube link from step 3 |
| Demo URL | https://saathi-crm.vercel.app (landing; the runtime is the Mac via cloudflared tunnel — explained in SUBMISSION.md) |
| Description / write-up | Link to `docs/SUBMISSION.md` in the repo, or paste the body |
| License | Apache 2.0 |

After submitting, confirm:
- Kaggle shows your entry with all URLs clickable
- Open every URL in a logged-out incognito tab — all must load

## 6. Optional: announce ☐

Twitter / LinkedIn post with the YouTube link. Impact-track judges often scan
social. Suggested template:

```
Shipped @Anthropic Saathi for the Gemma 4 Good Hackathon —
a voice-first CRM for Indian MSMEs, in Telugu, on the
owner's phone, built on @GoogleDeepMind Gemma 4 (8B).

10-second voice note → tracked customer.
Tap → Telugu WhatsApp follow-up.
$0/month per shop. Apache 2.0.

[YouTube link]
```

---

## What's already done (no action needed)

- ✅ Public repo prepared with Apache 2.0 LICENSE
- ✅ README runnable in <10 minutes with screenshots
- ✅ SUBMISSION.md write-up complete (4 capability-honesty notes, architecture, cost model, impact)
- ✅ All 14 anti-slop rules pass (em dash sweep, emoji sweep, banned icon sweep — all empty)
- ✅ Secrets scan clean — no Twilio SIDs, Supabase keys, or generic tokens in tracked files
- ✅ `.env.local` properly gitignored; only `.env.example` (template) is tracked
- ✅ 90-second demo video built (`video/output/submission.mp4`)
- ✅ Video assembly fully reproducible — `video/build.sh` rebuilds from scratch
- ✅ Real Gemma 4 function-call trace visible in the video at shots 5 and 6
- ✅ Real Twilio WhatsApp send infrastructure wired (Sandbox; production swap is one env var)
- ✅ Telugu generation validated — Gemma drafts review well per Day 7 pilot

## Pre-submission sanity replay

Before clicking Submit on Kaggle, run these once on a fresh terminal:

```bash
cd /Users/jaggu/Desktop/Gemma4/saathi-crm
git status                                  # → working tree clean
git log --oneline -5                        # → see "Day 7" + "video assembly" commits
curl -sI https://saathi-crm.vercel.app | head -1  # → HTTP/2 200
open video/output/submission.mp4            # → plays for 90s with subtitles
ls samples/ramesh_te.m4a samples/swift.jpg  # → both present
grep -rE "sb_secret_|AC[a-f0-9]{32}" --include="*.ts" --include="*.json" . | grep -v node_modules
# → empty
```

If all six pass, ship it.
