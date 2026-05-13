#!/usr/bin/env bash
# Build the Saathi submission video from captured stills + VO segments.
# Output: video/output/submission.mp4 (1920x1080, ~90s, H.264 + AAC).

set -e
cd "$(dirname "$0")"

CLIPS=clips
ASSETS=assets
AUD=audio
OUT=output
mkdir -p "$CLIPS" "$OUT"

# Saathi tokens
BG="0xFFF8EE"       # cream
ACCENT="F6A623"     # saffron
TEXT="1B1B1F"
MUTED="6B6B72"

# Canvas
W=1920
H=1080
FPS=30

# Phone frame: place phone screenshots at this size, centred on canvas.
# Phone aspect = 390:844; height 1000 -> width 462 (rounded to even).
PH=1000
PW=462

# Common pre-filter: render a phone image onto the cream canvas, centred.
# Usage:  phone_filter <duration_seconds> <zoomspec>
# Outputs a [vout] label.
phone_to_canvas() {
  local IMG="$1"; local DUR="$2"
  local Z="${3:-1.00}"  # final zoom multiplier
  ffmpeg -y -loglevel error \
    -f lavfi -t "$DUR" -i "color=c=${BG}:s=${W}x${H}:r=${FPS}" \
    -loop 1 -t "$DUR" -i "$IMG" \
    -filter_complex "
      [1:v]scale=${PW}:${PH}:flags=lanczos[ph];
      [0:v][ph]overlay=(W-w)/2:(H-h)/2:format=auto[out]
    " \
    -map "[out]" -an -t "$DUR" -r "$FPS" -pix_fmt yuv420p "$4"
}

# Place an image at a custom rect (used for fullscreen cards and owner photo).
fullscreen_card() {
  local IMG="$1"; local DUR="$2"; local OUTFILE="$3"
  ffmpeg -y -loglevel error \
    -loop 1 -t "$DUR" -i "$IMG" \
    -vf "scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=${BG},format=yuv420p" \
    -r "$FPS" -t "$DUR" -an "$OUTFILE"
}

# Owner photo — portrait scaled to fit canvas height, centered on cream
# background, with a very subtle Ken Burns zoom (1.0 → ~1.05 over the shot).
owner_kenburns() {
  local DUR="$1"; local OUTFILE="$2"
  local TFRAMES=$((DUR * FPS))
  # Increment per frame: total zoom delta of 0.05 / TFRAMES
  local ZSTEP
  ZSTEP=$(awk "BEGIN{printf \"%.6f\", 0.05 / ${TFRAMES}}")
  ffmpeg -y -loglevel error \
    -f lavfi -t "$DUR" -i "color=c=${BG}:s=${W}x${H}:r=${FPS}" \
    -loop 1 -t "$DUR" -i "${ASSETS}/owner.jpg" \
    -filter_complex "
      [1:v]scale=-1:1040:flags=lanczos[scaled];
      [0:v][scaled]overlay=(W-w)/2:(H-h)/2:format=auto,format=yuv420p[padded];
      [padded]zoompan=z='min(zoom+${ZSTEP},1.05)':d=${TFRAMES}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${W}x${H}:fps=${FPS}[out]
    " \
    -map "[out]" -an -t "$DUR" -r "$FPS" "$OUTFILE"
}

# Crop & enlarge the top of the draft-review screenshot to show the tool-call row.
toolcall_zoom() {
  local DUR="$1"; local OUTFILE="$2"
  # 780x1688 source. Top header + ToolCallLog row sit in roughly y=0..420.
  ffmpeg -y -loglevel error \
    -f lavfi -t "$DUR" -i "color=c=${BG}:s=${W}x${H}:r=${FPS}" \
    -loop 1 -t "$DUR" -i "${ASSETS}/shot6d_draft_review.png" \
    -filter_complex "
      [1:v]crop=780:420:0:0,scale=1700:-1:flags=lanczos[crop];
      [0:v][crop]overlay=(W-w)/2:(H-h)/2:format=auto,format=yuv420p[out]
    " \
    -map "[out]" -an -t "$DUR" -r "$FPS" "$OUTFILE"
}

# Mux video + audio at exact duration (pads audio with silence at the tail).
mux_audio() {
  local VIN="$1"; local AIN="$2"; local DUR="$3"; local OUTFILE="$4"
  ffmpeg -y -loglevel error \
    -i "$VIN" \
    -i "$AIN" \
    -filter_complex "
      [1:a]apad,atrim=0:${DUR},asetpts=N/SR/TB[a]
    " \
    -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -t "$DUR" "$OUTFILE"
}

echo "===> Shot 1 (title, 8s)"
fullscreen_card "${ASSETS}/shot1_title.png" 8 "${CLIPS}/v1.mp4"
mux_audio "${CLIPS}/v1.mp4" "${AUD}/vo_1.m4a" 8 "${CLIPS}/01.mp4"

echo "===> Shot 2 (today, 7s)"
phone_to_canvas "${ASSETS}/shot2_today.png" 7 1.00 "${CLIPS}/v2.mp4"
mux_audio "${CLIPS}/v2.mp4" "${AUD}/vo_2.m4a" 7 "${CLIPS}/02.mp4"

echo "===> Shot 3 (record + owner voice, 15s)"
phone_to_canvas "${ASSETS}/shot3_record_idle.png" 15 1.00 "${CLIPS}/v3.mp4"
mux_audio "${CLIPS}/v3.mp4" "${AUD}/vo_3.m4a" 15 "${CLIPS}/03.mp4"

echo "===> Shot 4 (parsed customer, 8s)"
phone_to_canvas "${ASSETS}/shot4_customer.png" 8 1.00 "${CLIPS}/v4.mp4"
mux_audio "${CLIPS}/v4.mp4" "${AUD}/vo_4.m4a" 8 "${CLIPS}/04.mp4"

echo "===> Shot 5 (tool-call trace zoom, 4s)"
toolcall_zoom 4 "${CLIPS}/v5.mp4"
mux_audio "${CLIPS}/v5.mp4" "${AUD}/vo_5.m4a" 4 "${CLIPS}/05.mp4"

echo "===> Shot 6 (customers + draft, 13s)"
# Concatenated: customers list 4s -> customer detail 4s -> draft review 5s
phone_to_canvas "${ASSETS}/shot6a_customers.png" 4 1.00 "${CLIPS}/v6a.mp4"
phone_to_canvas "${ASSETS}/shot6c_customer_detail.png" 4 1.00 "${CLIPS}/v6b.mp4"
phone_to_canvas "${ASSETS}/shot6d_draft_review.png" 5 1.00 "${CLIPS}/v6c.mp4"
ffmpeg -y -loglevel error -i "${CLIPS}/v6a.mp4" -i "${CLIPS}/v6b.mp4" -i "${CLIPS}/v6c.mp4" \
  -filter_complex "[0:v][1:v][2:v]concat=n=3:v=1:a=0[v]" \
  -map "[v]" -r "$FPS" -t 13 -pix_fmt yuv420p "${CLIPS}/v6.mp4"
mux_audio "${CLIPS}/v6.mp4" "${AUD}/vo_6.m4a" 13 "${CLIPS}/06.mp4"

echo "===> Shot 7 (send, 10s)"
phone_to_canvas "${ASSETS}/shot6d_draft_review.png" 10 1.00 "${CLIPS}/v7.mp4"
mux_audio "${CLIPS}/v7.mp4" "${AUD}/vo_7.m4a" 10 "${CLIPS}/07.mp4"

echo "===> Shot 8 (owner photo, 15s) — caption comes from the SRT now"
owner_kenburns 15 "${CLIPS}/v8.mp4"
mux_audio "${CLIPS}/v8.mp4" "${AUD}/vo_8.m4a" 15 "${CLIPS}/08.mp4"

echo "===> Shot 9 (outro, 10s)"
fullscreen_card "${ASSETS}/shot9_outro.png" 10 "${CLIPS}/v9.mp4"
mux_audio "${CLIPS}/v9.mp4" "${AUD}/vo_9.m4a" 10 "${CLIPS}/09.mp4"

echo "===> Concatenating with re-encode + music bed + fades..."
# Uses the concat filter (handles audio format mismatches via re-encode),
# then mixes in the ambient music bed at low volume, and finally adds a
# fade-in (0.5s) and fade-out (1s) on both video and audio.
ffmpeg -y -loglevel error \
  -i "${CLIPS}/01.mp4" \
  -i "${CLIPS}/02.mp4" \
  -i "${CLIPS}/03.mp4" \
  -i "${CLIPS}/04.mp4" \
  -i "${CLIPS}/05.mp4" \
  -i "${CLIPS}/06.mp4" \
  -i "${CLIPS}/07.mp4" \
  -i "${CLIPS}/08.mp4" \
  -i "${CLIPS}/09.mp4" \
  -i "${AUD}/music.m4a" \
  -filter_complex "
    [0:v]setsar=1,fps=${FPS}[v0];
    [1:v]setsar=1,fps=${FPS}[v1];
    [2:v]setsar=1,fps=${FPS}[v2];
    [3:v]setsar=1,fps=${FPS}[v3];
    [4:v]setsar=1,fps=${FPS}[v4];
    [5:v]setsar=1,fps=${FPS}[v5];
    [6:v]setsar=1,fps=${FPS}[v6];
    [7:v]setsar=1,fps=${FPS}[v7];
    [8:v]setsar=1,fps=${FPS}[v8];
    [v0][0:a][v1][1:a][v2][2:a][v3][3:a][v4][4:a][v5][5:a][v6][6:a][v7][7:a][v8][8:a]
    concat=n=9:v=1:a=1[vcat][acat];
    [acat]aresample=async=1000,aformat=channel_layouts=stereo:sample_rates=48000,volume=1.0[avo];
    [9:a]aformat=channel_layouts=stereo:sample_rates=48000,volume=0.75[amus];
    [avo][amus]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[amix];
    [amix]afade=t=in:st=0:d=0.5,afade=t=out:st=89:d=1[aout];
    [vcat]fade=t=in:st=0:d=0.5,fade=t=out:st=89:d=1[vout]
  " \
  -map "[vout]" -map "[aout]" \
  -c:v libx264 -preset medium -crf 22 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -ar 48000 -ac 2 \
  -movflags +faststart \
  "${OUT}/_no_subs.mp4"

echo "===> Burning subtitles (PNG overlay — libass not present in this ffmpeg)..."
# Overlay each subtitle PNG at its time range. y position: 40px from bottom.
ffmpeg -y -loglevel error \
  -i "${OUT}/_no_subs.mp4" \
  -i "${ASSETS}/sub_01.png" -i "${ASSETS}/sub_02.png" -i "${ASSETS}/sub_03.png" \
  -i "${ASSETS}/sub_04.png" -i "${ASSETS}/sub_05.png" -i "${ASSETS}/sub_06.png" \
  -i "${ASSETS}/sub_07.png" -i "${ASSETS}/sub_08.png" -i "${ASSETS}/sub_09.png" \
  -filter_complex "
    [0:v][1:v]overlay=(W-w)/2:H-h-40:enable='between(t,0.5,7.8)'[s1];
    [s1][2:v]overlay=(W-w)/2:H-h-40:enable='between(t,8.0,14.8)'[s2];
    [s2][3:v]overlay=(W-w)/2:H-h-40:enable='between(t,15.2,29.4)'[s3];
    [s3][4:v]overlay=(W-w)/2:H-h-40:enable='between(t,30.0,37.8)'[s4];
    [s4][5:v]overlay=(W-w)/2:H-h-40:enable='between(t,38.0,41.8)'[s5];
    [s5][6:v]overlay=(W-w)/2:H-h-40:enable='between(t,42.0,54.8)'[s6];
    [s6][7:v]overlay=(W-w)/2:H-h-40:enable='between(t,55.0,64.8)'[s7];
    [s7][8:v]overlay=(W-w)/2:H-h-40:enable='between(t,65.5,79.5)'[s8];
    [s8][9:v]overlay=(W-w)/2:H-h-40:enable='between(t,80.5,89.5)'[vout]
  " \
  -map "[vout]" -map "0:a" \
  -c:v libx264 -preset medium -crf 22 -pix_fmt yuv420p \
  -c:a copy \
  -movflags +faststart \
  "${OUT}/submission.mp4"
rm -f "${OUT}/_no_subs.mp4"

DUR=$(ffprobe -v error -show_entries format=duration -of default=nokey=1:noprint_wrappers=1 "${OUT}/submission.mp4")
SIZE=$(du -h "${OUT}/submission.mp4" | cut -f1)
printf "\nBuilt %s  (%.2fs, %s)\n" "${OUT}/submission.mp4" "$DUR" "$SIZE"
