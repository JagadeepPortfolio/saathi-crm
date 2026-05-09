import type { Language, Message } from "@/lib/types";
import { db } from "./client";

export type CreateMessageArgs = {
  customer_id: string;
  direction: "outbound" | "inbound";
  language: Language;
  text: string;
  status: Message["status"];
  whatsapp_message_id?: string | null;
  ai_tool_call_meta?: Record<string, unknown>;
};

export async function createMessage(args: CreateMessageArgs): Promise<Message> {
  const { data, error } = await db()
    .from("messages")
    .insert({
      customer_id: args.customer_id,
      direction: args.direction,
      channel: "whatsapp",
      language: args.language,
      text: args.text,
      status: args.status,
      whatsapp_message_id: args.whatsapp_message_id ?? null,
      ai_tool_call_meta: args.ai_tool_call_meta ?? {},
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(`createMessage failed: ${error?.message}`);
  return data as Message;
}

export async function updateMessageStatusByProviderId(
  whatsappMessageId: string,
  status: Message["status"]
): Promise<void> {
  const { error } = await db()
    .from("messages")
    .update({ status })
    .eq("whatsapp_message_id", whatsappMessageId);
  if (error) throw new Error(`updateMessageStatusByProviderId failed: ${error.message}`);
}

export async function listMessagesForCustomer(customerId: string): Promise<Message[]> {
  const { data, error } = await db()
    .from("messages")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`listMessagesForCustomer failed: ${error.message}`);
  return (data ?? []) as Message[];
}
