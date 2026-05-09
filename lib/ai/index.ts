// Adapter selector. Set AI_MODE=local | modal | mock.
// local — Ollama-backed Gemma 4 (default; via Cloudflare Tunnel in production)
// modal — Modal serverless backup. Deploy modal/saathi_inference.py first
//         and set MODAL_GEMMA_URL.
// mock  — canned responses for unit tests; never the demo default

import type { AIAdapter } from "./adapter";
import { gemmaAdapter } from "./gemmaAdapter";
import { modalAdapter } from "./modalAdapter";
import { mockAdapter } from "./mockAdapter";

export function ai(): AIAdapter {
  const mode = process.env.AI_MODE ?? "local";

  switch (mode) {
    case "local":
      return gemmaAdapter;
    case "modal":
      return modalAdapter;
    case "mock":
      return mockAdapter;
    default:
      throw new Error(`Unknown AI_MODE: ${mode}`);
  }
}
