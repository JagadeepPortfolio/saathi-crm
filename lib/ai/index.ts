// Adapter selector. Set AI_MODE=local | modal | mock.
// local — Ollama-backed Gemma 4 (default; via Cloudflare Tunnel in production)
// modal — Modal serverless backup (Day 9)
// mock  — canned responses for unit tests; never the demo default

import type { AIAdapter } from "./adapter";
import { gemmaAdapter } from "./gemmaAdapter";
import { mockAdapter } from "./mockAdapter";

export function ai(): AIAdapter {
  const mode = process.env.AI_MODE ?? "local";

  switch (mode) {
    case "local":
      return gemmaAdapter;
    case "mock":
      return mockAdapter;
    case "modal":
      throw new Error("AI_MODE=modal is not implemented yet (Day 9).");
    default:
      throw new Error(`Unknown AI_MODE: ${mode}`);
  }
}
