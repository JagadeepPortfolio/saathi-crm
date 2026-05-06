// English UI strings. Hand-written, never LLM-translated. See docs/ANTI_SLOP.md.

export const en = {
  app: { name: "Saathi" },
  today: {
    addedLabel: "Today",
    addedSuffix: "added",
    lapsedLabel: "Lapsed",
    recent: "Recent",
    emptyRecent: "Add your first customer.",
    record: "Record",
  },
  record: {
    tapToRecord: "Tap to record",
    tapToStop: "Tap to stop",
    transcribing: "Transcribing...",
    parsing: "Parsing...",
    saving: "Saving...",
    saved: "Saved.",
    addPhoto: "Add Photo",
    save: "Save",
    confirm: "Confirm",
    tooShort: "Try again, speak for at least 3 seconds.",
  },
  customers: {
    title: "Customers",
    search: "Search",
    all: "All",
    today: "Today",
    lapsed: "Lapsed",
    repeat: "Repeat",
  },
  detail: {
    visits: "Visits",
    messages: "Messages",
    edit: "Edit",
    draft: "Draft follow-up",
  },
  draft: {
    title: "Draft follow-up",
    to: "to",
    language: "Language",
    send: "Send",
    sending: "Sending to WhatsApp...",
    sent: "Sent.",
  },
} as const;

export type StringKey = keyof typeof en;
