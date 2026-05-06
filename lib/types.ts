// Saathi CRM — shared TypeScript types
// See docs/DATA_MODEL.md for the source of truth.

export type Language = "te" | "hi" | "en";

export type Shop = {
  id: string;
  name: string;
  whatsapp_phone: string;
  default_language: Language;
  created_at: string;
};

export type Customer = {
  id: string;
  shop_id: string;
  name: string;
  phone: string | null;
  preferred_language: Language;
  primary_car_id: string | null;
  first_visit_at: string;
  last_visit_at: string;
  visit_count: number;
  notes: string | null;
  created_at: string;
};

export type CustomerStatus = "active" | "amber" | "lapsed";

export function customerStatus(c: Pick<Customer, "last_visit_at">): CustomerStatus {
  const days = (Date.now() - new Date(c.last_visit_at).getTime()) / 86_400_000;
  if (days >= 60) return "lapsed";
  if (days >= 45) return "amber";
  return "active";
}

export type Car = {
  id: string;
  customer_id: string;
  license_plate: string | null;
  make: string | null;
  model: string | null;
  color: string | null;
  photo_url: string | null;
};

export type Visit = {
  id: string;
  customer_id: string;
  car_id: string | null;
  services: string[];
  amount_inr: number;
  notes: string | null;
  next_visit_hint: string | null;
  intake_audio_url: string | null;
  intake_photo_url: string | null;
  raw_transcript: string | null;
  ai_tool_call_meta: Record<string, unknown>;
  created_at: string;
};

export type Message = {
  id: string;
  customer_id: string;
  direction: "outbound" | "inbound";
  channel: "whatsapp";
  language: Language;
  text: string;
  status: "drafted" | "sent" | "delivered" | "read" | "failed";
  whatsapp_message_id: string | null;
  ai_tool_call_meta: Record<string, unknown>;
  created_at: string;
};

export type FollowUp = {
  id: string;
  customer_id: string;
  scheduled_for: string;
  occasion: "lapsed" | "thankyou" | "reminder";
  status: "pending" | "sent" | "cancelled";
  created_at: string;
};

export type CustomerSummary = {
  id: string;
  name: string;
  phone: string | null;
  license_plate: string | null;
};
