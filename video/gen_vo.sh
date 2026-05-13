#!/usr/bin/env bash
# Generate VO segments via macOS `say`. Outputs m4a for each shot.
# Voice "Rishi" (en_IN) — closest fit for the Indian-SMB narrative.
# Replace with your own iPhone-recorded VO later for higher quality.

set -e
cd "$(dirname "$0")"

VOICE="${VOICE:-Rishi}"
RATE="${RATE:-170}"
OUT=audio
mkdir -p "$OUT"

declare -a SHOTS=(
  "1|A small detailing studio in Hyderabad. The owner serves about fifteen customers a week, and forgets most of them within a month."
  "2|Saathi is a CRM that lives on his phone. No app store, no SaaS subscription, no English forms."
  "4|That voice goes to whisper dot cpp for Telugu transcription. The transcript and the car photo go to Gemma 4."
  "5|A real Gemma 4 function call."
  "6|Two days later, one tap drafts a Telugu follow-up. Gemma 4 reads the visit history and writes in the owner's voice, not in marketing voice."
  "7|He approves, and sends. Through the WhatsApp business API. To a real customer."
  "8|This is the owner of the shop. He runs his business in Telugu, on his phone. With Saathi, his CRM does the same."
  "9|Saathi. Built on Gemma 4."
)

for s in "${SHOTS[@]}"; do
  IFS='|' read -r N TEXT <<< "$s"
  TMP="$OUT/vo_${N}.aiff"
  M4A="$OUT/vo_${N}.m4a"
  say -v "$VOICE" -r "$RATE" -o "$TMP" "$TEXT"
  ffmpeg -y -loglevel error -i "$TMP" -codec:a aac -b:a 160k "$M4A"
  rm -f "$TMP"
  DUR=$(ffprobe -v error -show_entries format=duration -of default=nokey=1:noprint_wrappers=1 "$M4A")
  printf "vo_%s.m4a  %.2fs\n" "$N" "$DUR"
done

# Shot 3: copy the owner's intake audio, trimmed to 14s with a 0.5s fadeout
ffmpeg -y -loglevel error -i assets/owner_audio.m4a -t 14 -af "afade=t=out:st=13.5:d=0.5" -codec:a aac -b:a 160k "$OUT/vo_3.m4a"
echo "vo_3.m4a (owner intake clip, trimmed to 14s)"
