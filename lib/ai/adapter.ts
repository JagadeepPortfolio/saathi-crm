// AI adapter interface — see docs/GEMMA_INTEGRATION.md.
// Three implementations live in this folder:
//   gemmaAdapter.ts   default — Cloudflare Tunnel to Mac-local Gemma 4
//   modalAdapter.ts   backup  — Modal serverless GPU
//   mockAdapter.ts    tests   — never the demo default
//
// The selector in index.ts picks one based on AI_MODE.

import type { Customer, CustomerSummary, Language, Visit } from "@/lib/types";

export type ToolCallMeta = {
  model: string;
  input_tokens: number;
  output_tokens: number;
  ms: number;
};

export type ParseIntakeInput = {
  transcript: string;
  photoBase64?: string | null;
  language: Language;
  knownCustomers: CustomerSummary[];
};

export type IntakeToolCall =
  | { name: "customer.create"; arguments: CustomerCreateArgs }
  | { name: "customer.update"; arguments: CustomerUpdateArgs };

export type CustomerCreateArgs = {
  name: string;
  phone?: string;
  preferred_language: Language;
  car?: {
    license_plate?: string;
    make?: string;
    model?: string;
    color?: string;
  };
  visit: VisitArgs;
};

export type CustomerUpdateArgs = {
  customer_id: string;
  visit: VisitArgs;
  field_updates?: Partial<{
    phone: string;
    preferred_language: Language;
    notes: string;
  }>;
};

export type VisitArgs = {
  services: string[];
  amount_inr: number;
  notes?: string;
  next_visit_hint?: string;
};

export type ParseIntakeResult = {
  toolCall: IntakeToolCall;
  meta: ToolCallMeta;
};

export type DraftFollowupInput = {
  customer: Customer;
  visits: Visit[];
  targetLanguage: Language;
  occasion?: "lapsed" | "thankyou" | "reminder";
};

export type DraftFollowupResult = {
  text: string;
  meta: ToolCallMeta;
};

export interface AIAdapter {
  parseIntake(input: ParseIntakeInput): Promise<ParseIntakeResult>;
  draftFollowup(input: DraftFollowupInput): Promise<DraftFollowupResult>;
}
