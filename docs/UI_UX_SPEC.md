# UI/UX Spec — Saathi CRM

Design direction: **Saathi Saffron**. Warm, premium, culturally rooted, anti-slop. Mobile-first, designed for 390px iPhone width. Read `ANTI_SLOP.md` before any pixel ships.

## Saathi Saffron — design tokens

```css
/* tailwind.config.ts colors */
:root {
  --bg:           #FFF8F0;   /* warm cream */
  --surface:      #FFFFFF;   /* white cards on cream */
  --surface-2:    #FAF3E7;   /* secondary surface, list dividers */
  --primary:      #D97706;   /* deep marigold */
  --primary-700:  #B45309;   /* pressed state */
  --secondary:    #0F766E;   /* deep teal — trust partner */
  --accent:       #DC2626;   /* selective red, alerts/escalations only */
  --success:      #16A34A;   /* sent / delivered states */
  --text:         #1F2937;   /* charcoal */
  --text-muted:   #6B7280;   /* secondary text — used sparingly */
  --border:       #F3E8D2;   /* soft cream-brown */
  --border-dark:  #E5DBC7;
}
```

Use no other colors. If a designer instinct says "let me add a soft purple here," delete that instinct.

## Typography

- **Latin (English) UI:** Inter, -apple-system fallback
- **Telugu / Hindi:** -apple-system on iOS (renders Telugu/Devanagari well via Apple's Indic fonts), Noto Sans Telugu / Devanagari on Android
- Two sizes only:
  - **Large:** 24–28px / line-height 1.3 — primary content (customer name, the next action)
  - **Regular:** 16px / line-height 1.5 — everything else
- **No 12px gray metadata text.** Owner is 40+, daylight, full brightness. If something is too unimportant for 16px, it's too unimportant to render.
- Weights: 400 (body), 600 (headings, button labels). No 300, no 800.

## Spacing

```
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-5: 24px
--space-6: 32px
--space-7: 48px
```

Base unit is 4px. Touch targets ≥48px tall, primary actions 56px. Padding inside cards: 16px.

## Components

### Button
```
primary:    bg-primary text-white font-semibold rounded-xl px-5 h-14
            (one per screen; this is the "tap this next" button)
secondary:  bg-surface text-text border border-border rounded-xl px-5 h-12
ghost:      text-secondary underline-offset-2 (links / minor actions)
```

No outline buttons. No "tertiary" buttons. No icon-only buttons except for: back arrow, mic, camera. Buttons use **verbs** as labels (`Record`, `Send`, `Save`, `Approve`, `Edit`).

### Card
- White surface on cream background
- Border 1px `--border`
- Border-radius 16px
- Padding 16px
- Shadow only when elevated (modals, dropdowns); list cards have no shadow

### Input
- Bottom-bordered, not boxed. Border `--border-dark`, focus `--primary`.
- Label above, 16px, `--text`. No placeholder-as-label (accessibility + Indic rendering).
- Min height 48px.

### Textarea (draft)
- Boxed, 1px `--border-dark`, radius 12px, padding 12px
- Min height 6 lines (Telugu wraps tall)
- Mono-spacing forbidden; use the same body font

### Pill / chip (filters)
- Inactive: cream surface, charcoal text, 1px border
- Active: marigold fill, white text, no border
- Height 36px, padding 12px

### Tool-call log row (demo mode only)
```
fixed top-of-content bar, --secondary text on --surface-2 fill,
12px monospace (allowed here as it signals "log"), 100% width,
border-bottom 1px --border. Rendered only when ?demo=1.
```

## Screens

### Today (`/`)

```
┌────────────────────────────────┐
│ Saathi          🇮🇳 EN ▾       │  ← header 64px, language switcher right
│ Dust Defender Lab              │
├────────────────────────────────┤
│ Tuesday, 6 May                 │
│                                │
│ [ 3 added today ]  [ 12 lapsed]│  ← stat row (cards), tappable
│                                │
│ Recent                         │  ← section header (large)
│ ┌────────────────────────────┐ │
│ │ Ramesh                     │ │
│ │ Blue Swift · TS09EX1234    │ │
│ │ Today, 11:24am             │ │
│ └────────────────────────────┘ │
│ (4 more rows…)                 │
│                                │
├────────────────────────────────┤
│      [  ● Record  ]            │  ← sticky bottom, marigold, 56px
└────────────────────────────────┘
```

### Record (`/record`, full-screen route)

States in order:
1. Idle: large mic button center, label "Tap to record"
2. Recording: waveform animating, timer, "Tap to stop"
3. Transcribing: spinner with text "Transcribing Telugu..." (real status)
4. Transcript shown: editable textarea + "Add Photo" secondary
5. Photo added: thumbnail + "Save" primary
6. Saving: status text walks through ASR → Gemma → Supabase steps
7. Confirmation: parsed fields editable, "Confirm" primary

No bouncing icons. No springs. Status transitions are honest fades.

### Customers (`/customers`)

```
┌────────────────────────────────┐
│ ← Customers                    │
│ ┌────────────────────────────┐ │
│ │ 🔍 Search                  │ │
│ └────────────────────────────┘ │
│ [All]  [Today]  [Lapsed]  [Repeat]
│                                │
│ Ramesh                         │
│ Swift · TS09EX1234 · today     │
│ ─────────────────              │
│ Anitha                         │
│ Honda City · TS07AB1122 · 75d  │  ← red dot for lapsed
│ ─────────────────              │
│ ...                            │
└────────────────────────────────┘
```

List rows are flat, no shadow. Status dot: green (active), amber (45–60d), red (lapsed).

### Customer Detail (`/customers/[id]`)

```
┌────────────────────────────────┐
│ ← Ramesh                       │
│                                │
│ Ramesh                         │  ← large
│ +91 98XXX XXXXX                │
│ Blue Swift · TS09EX1234        │
│ Last visit: 75 days ago        │
│                                │
│ Visits                         │
│ ┌────────────────────────────┐ │
│ │ 21 Feb 2026                │ │
│ │ Full ceramic detailing     │ │
│ │ ₹2,500                     │ │
│ │ "wax smell complaint"      │ │
│ └────────────────────────────┘ │
│ (more visits…)                 │
│                                │
│ Messages                       │
│ ┌────────────────────────────┐ │
│ │ Sent · 25 Feb · TE         │ │
│ │ "namaste Ramesh garu…"     │ │
│ └────────────────────────────┘ │
│                                │
├────────────────────────────────┤
│ [Edit]      [Draft follow-up]  │  ← action bar; Draft is primary
└────────────────────────────────┘
```

### Draft Review (modal-fullscreen)

```
┌────────────────────────────────┐
│ ✕                              │
│ Draft follow-up                │  ← large
│ to Ramesh · +91 98XXX XXXXX    │
│                                │
│ Language:  [TE]  HI   EN       │  ← pill toggle
│                                │
│ ┌────────────────────────────┐ │
│ │ Namaste Ramesh garu, మీ    │ │
│ │ blue Swift కి last full    │ │
│ │ ceramic detailing చేసి …   │ │  ← editable
│ └────────────────────────────┘ │
│                                │
│ ▸ whatsapp.send_template      │  ← log row, demo mode
│   to +91 98XXX XXXXX (te)      │
│                                │
├────────────────────────────────┤
│            [ Send ]            │  ← marigold, 56px
└────────────────────────────────┘
```

## Bottom navigation

Two tabs only: **Today**, **Customers**. Nothing else. No emoji icons; minimalist line glyphs (Lucide `home` and `users`). Active state: marigold fill on the icon, label below 12px (the only place 12px is allowed — bottom nav labels). Active tab indicator: 2px line above the icon.

## Iconography

Lucide icons only. Allowed:
- `mic` (record button)
- `camera` (photo capture)
- `home` (Today nav)
- `users` (Customers nav)
- `arrow-left` (back)
- `x` (modal close)
- `pencil` (edit)
- `send` (send button — accompanies "Send" label, doesn't replace it)
- `search` (in search input)

Banned: `sparkles`, `wand-2`, `brain`, `bot`, `zap`, `star`, anything that signals "AI magic."

## Motion

- Route transitions: 200ms slide in/out
- Modal: 200ms fade + 8px translate
- List item insertion: 150ms fade
- No spring physics
- No parallax, no scroll-driven animation
- Reduce-motion media query respected

## Loading states

Loading is *not* a generic spinner. Each operation walks through real steps:

- **Intake:** *Saving audio… · Transcribing Telugu… · Parsing… · Saved.*
- **Draft:** *Reading visit history… · Drafting in Telugu… · Ready.*
- **Send:** *Sending to WhatsApp… · Sent.*

Each step is a single line, fades to the next, ≤300ms transition. The text is the truth, not marketing.

## Empty states

- **No customers yet:** illustration-free. Just text: *"Add your first customer."* + the marigold Record button.
- **No lapsed customers:** *"No one's lapsed. Nice."*
- **Draft modal first time:** *"Saathi will draft a message in your customer's language. You approve before sending."*

No illustrations, no mascots, no "Get started!" with a sparkle.

## PWA shell

- Manifest: `name: Saathi`, `short_name: Saathi`, `display: standalone`, `theme_color: #D97706`, `background_color: #FFF8F0`
- Icons: 192px, 512px, maskable. Just the wordmark "Saathi" in marigold on cream. No icon mascot.
- Splash: matches background_color, no animation
- Service worker: cache shell + offline fallback page that says "Saathi needs internet to send messages, but your local data is safe."

## Accessibility

- Color contrast verified for charcoal-on-cream and marigold-on-white (both >4.5:1)
- All actionable elements have aria-label in EN/HI/TE
- Focus rings visible (2px marigold outline)
- Voice input is the primary input method — typing is always optional
- Telugu/Hindi UI strings reviewed by the owner before submission
