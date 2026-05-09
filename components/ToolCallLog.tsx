"use client";

/*
 * Demo-mode tool-call trace.
 * Rendered only when ?demo=1 is on the URL. Hidden by default in production.
 *
 * Anti-slop note (docs/ANTI_SLOP.md rule 10): the trace is monospace because
 * it explicitly signals "log" — not chrome. Visible to judges in the demo
 * video as the "real Gemma 4 function call" beat per docs/DEMO_SCRIPT.md.
 */

import { useSearchParams } from "next/navigation";

export type ToolCallEntry = {
  step: string;
  ms?: number;
  status: "pending" | "done" | "fail";
};

export type ToolCallLogProps = {
  entries: ToolCallEntry[];
};

const GLYPH = {
  pending: "→",
  done: "✓",
  fail: "✗",
} as const;

export default function ToolCallLog({ entries }: ToolCallLogProps) {
  const params = useSearchParams();
  if (params.get("demo") !== "1") return null;
  if (entries.length === 0) return null;

  return (
    <div
      role="log"
      aria-label="Function call trace"
      className="border-y border-border bg-surface-2 px-3 py-2 font-mono text-xs leading-5 text-secondary"
    >
      {entries.map((e, i) => (
        <div key={`${e.step}-${i}`} className="flex items-center gap-2">
          <span className="w-3 shrink-0 text-center" aria-hidden="true">
            {GLYPH[e.status]}
          </span>
          <span className="truncate">
            {e.step}
            {typeof e.ms === "number" ? `  (${e.ms}ms)` : ""}
          </span>
        </div>
      ))}
    </div>
  );
}
