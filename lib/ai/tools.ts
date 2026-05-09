// Function-call JSON schemas for the Gemma 4 endpoint.
// Two scoped tool sets — one per agent (intake, followup).
// See docs/AI_AGENT_SPEC.md.

export const INTAKE_TOOLS = [
  {
    name: "customer.search",
    description:
      "Find an existing customer by phone, license plate, or fuzzy name match.",
    parameters: {
      type: "object",
      properties: {
        phone: { type: "string" },
        license_plate: { type: "string" },
        name_fuzzy: { type: "string" },
      },
    },
  },
  {
    name: "customer.create",
    description: "Create a new customer record with their first visit.",
    parameters: {
      type: "object",
      required: ["name", "preferred_language", "visit"],
      properties: {
        name: { type: "string" },
        phone: { type: "string", description: "E.164 if extractable" },
        preferred_language: { type: "string", enum: ["te", "hi", "en"] },
        car: {
          type: "object",
          properties: {
            license_plate: { type: "string" },
            make: { type: "string" },
            model: { type: "string" },
            color: { type: "string" },
          },
        },
        visit: {
          type: "object",
          required: ["services", "amount_inr"],
          properties: {
            services: { type: "array", items: { type: "string" } },
            amount_inr: { type: "number" },
            notes: { type: "string" },
            next_visit_hint: { type: "string" },
          },
        },
      },
    },
  },
  {
    name: "customer.update",
    description: "Append a visit or update fields on an existing customer.",
    parameters: {
      type: "object",
      required: ["customer_id", "visit"],
      properties: {
        customer_id: { type: "string" },
        visit: {
          type: "object",
          required: ["services", "amount_inr"],
          properties: {
            services: { type: "array", items: { type: "string" } },
            amount_inr: { type: "number" },
            notes: { type: "string" },
            next_visit_hint: { type: "string" },
          },
        },
        field_updates: { type: "object" },
      },
    },
  },
] as const;

export const FOLLOWUP_TOOLS = [
  {
    name: "whatsapp.send_text",
    description:
      "Send a free-form text message. Only valid within a 24-hour conversation window.",
    parameters: {
      type: "object",
      required: ["to", "text", "language"],
      properties: {
        to: { type: "string", description: "E.164 phone" },
        text: { type: "string" },
        language: { type: "string", enum: ["te", "hi", "en"] },
      },
    },
  },
  {
    name: "whatsapp.send_template",
    description:
      "Send a pre-approved template. Use when out of the 24-hour window.",
    parameters: {
      type: "object",
      required: ["to", "template_name", "variables", "language"],
      properties: {
        to: { type: "string" },
        template_name: {
          type: "string",
          enum: ["lapsed_followup", "thankyou", "reminder"],
        },
        variables: { type: "object" },
        language: { type: "string", enum: ["te", "hi", "en"] },
      },
    },
  },
] as const;
