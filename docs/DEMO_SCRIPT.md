# Demo Script — Saathi CRM

## Length

**90 seconds.** Hard cap. Submission category videos run 60–120s; 90s is the readable upper bound.

## What the video must show (judging-aligned)

- **Impact:** real shop, real owner, real Telugu, real customer touched. Owner clip is the heart.
- **Technical execution:** a visible function call (the tool-call log row) firing, multimodal input (voice + photo), real WhatsApp message arriving on a phone screen.
- **Communication:** voiceover frames the problem cleanly in 15 seconds, the demo speaks for itself for 60 seconds, closing 15 seconds.

## Shot list (storyboard)

The technical demo is screen-recorded from a desktop browser sized to a
390 px iPhone viewport, so judges see every pixel of the PWA at full
fidelity. The shop / owner shots are filmed at the shop with an iPhone.

| # | Time | Shot | Audio |
|---|---|---|---|
| 1 | 0:00–0:08 | Wide of the detailing shop in Hyderabad. Owner working on a car. | VO: *"This is a small detailing studio in Hyderabad. The owner serves about 15 customers a week — and forgets most of them within a month."* |
| 2 | 0:08–0:15 | Screen recording: Saathi PWA loads in the mobile-viewport browser. Tagline visible. | VO: *"Saathi is a CRM that lives on his phone. No app store, no English forms, no SaaS subscription."* |
| 3 | 0:15–0:30 | Screen recording: tap Record, live waveform draws while owner's pre-recorded Telugu voice plays. | Diegetic Telugu audio (the owner's voice, recorded at the shop). Subtitle in English: *"Ramesh sir, blue Swift, full ceramic detailing, two thousand five hundred, told him to come back in two months."* |
| 4 | 0:30–0:38 | Screen recording: upload the real car photo from the shop visit; cut to the parsed customer record filling in. | VO: *"Voice goes to whisper.cpp for Telugu transcription. Text plus the car photo go to Gemma 4, which extracts the plate, the service, the amount."* |
| 5 | 0:38–0:42 | Tight crop on the demo-mode log row: *ASR (2.6s) → Gemma 4 (8.5s) → customer.create → Supabase*. | VO: *"That's a real Gemma 4 function call, not a regex."* |
| 6 | 0:42–0:55 | Caption: "Two days later." Screen recording: Customers → Lapsed → pick a customer → Draft follow-up. Telugu draft fills the textarea letter by letter. | VO: *"Two days later, one tap drafts a Telugu follow-up. Gemma 4 reads the visit history and writes in the owner's voice, not in marketing voice."* |
| 7 | 0:55–1:05 | Screen recording: tap Send. Cut to a real iPhone screen — the customer's phone — where the WhatsApp message arrives in Telugu. | VO: *"He approves and sends. The message goes through the WhatsApp Business API, in Telugu, to a real customer."* |
| 8 | 1:05–1:20 | **Owner clip** — owner speaks 12 seconds in Telugu directly to camera, in the shop. Subtitle in English. | Owner: *"Before, I forgot most of my customers. Now I send messages in Telugu and they come back. This is the first software made for me."* |
| 9 | 1:20–1:30 | Outro card: Saathi wordmark on cream + one-liner: *"Built on Gemma 4. For the 63 million Indian small businesses still locked out of CRM."* | Music fades. |

## Voiceover script (95 words, ~85 seconds at standard pace)

> This is a small detailing studio in Hyderabad. The owner serves about 15 customers a week, and forgets most of them within a month. Saathi is a CRM that lives on his phone. No app store, no English forms, no SaaS subscription. He records a voice note in Telugu, photographs the car, and Saathi turns it into a tracked customer. Voice goes to whisper.cpp for Telugu. Text and the photo go to Gemma 4. That's a real Gemma 4 function call. Two days later, one tap drafts a Telugu follow-up. He approves and sends. Through the WhatsApp Business API, to a real customer.

## Owner clip — Telugu script (suggested, owner adapts)

> "ఇంతకు ముందు చాలామంది customers ని మర్చిపోయేవాడిని. Saathi వచ్చాక Telugu లో message చేస్తున్నాను, వాళ్ళు మళ్ళీ వస్తున్నారు. ఇది నా కోసం చేసిన మొదటి software."

(Subtitle in English: *"Before, I forgot most of my customers. Now I send messages in Telugu and they come back. This is the first software made for me."*)

## B-roll requirements (capture during owner field validation, Day 7)

Shop / owner footage (one iPhone, one shop visit):

- Wide of the shop exterior + interior
- Owner working on a car (close-up hands)
- Owner recording a 25-second Telugu voice note into the developer's iPhone (this audio is what plays during shot #3)
- A real customer car with plate visible (with permission, or use the owner's own car)
- WhatsApp arriving on the owner's own phone screen (shot #7)
- Owner-to-camera clip in Telugu (shot #8)

Technical demo (screen recording, captured later on the Mac):

- Mac Safari sized to 390 × 844 px via Develop → Responsive Design Mode → iPhone 15 Pro
- macOS screen recording (Cmd+Shift+5) bounded to the viewport rectangle
- Same code path the iPhone PWA would render — the layout, tokens, and interactions are bit-identical

## Technical setup for shooting

- Shop / owner camera: iPhone 14+ (4K30, cinematic mode off)
- Audio: lapel mic into iPhone for owner clip; ambient mic for VO recorded later
- Lighting: shop's existing lighting plus one warm fill if dim
- Screen capture: 60 fps at 1170×2532 to match iPhone 15 Pro pixel dimensions; downscale at edit time
- Editing: CapCut or Final Cut. Subtitles burned in (not soft) so judges don't have to enable captions

## Edit pacing

- Cuts every 4–8 seconds, no longer
- No transitions other than hard cut and one 0.3s cross-dissolve into the owner clip
- Outro card holds for 5s minimum so the URL is readable

## What this video deliberately avoids

- No screen recording without context (judges have seen 100 screen-record demos this week)
- No AI voiceover. Use a human voice for VO, even if it's the developer's
- No frantic music. Subtle Indian-classical-adjacent score, low mix
- No "this changes everything" / "the future of" framing
- No technical jargon in VO; technical depth lives in the write-up

## Submission checklist

- [ ] Final video ≤90s
- [ ] Subtitles burned in for Telugu segments
- [ ] Owner clip included (this is the impact score)
- [ ] One visible function-call trace (this is the technical-execution score)
- [ ] Real WhatsApp message arrival shown (proves the loop closed)
- [ ] No AI-generated voiceover
- [ ] Outro card with Saathi mark + single-line tagline
- [ ] Uploaded as unlisted YouTube; URL in the Kaggle submission
