// Adapter selector. Set AI_MODE=local | modal | mock.
// Day 1: only `mock` is wired up. `local` and `modal` land on Day 2 and Day 9.

import type { AIAdapter } from "./adapter";
import { mockAdapter } from "./mockAdapter";

export function ai(): AIAdapter {
  const mode = process.env.AI_MODE ?? "local";

  switch (mode) {
    case "mock":
      return mockAdapter;
    case "local":
    case "modal":
      throw new Error(
        `AI_MODE=${mode} is not implemented yet. Day 2 wires up the local Gemma adapter.`
      );
    default:
      throw new Error(`Unknown AI_MODE: ${mode}`);
  }
}
