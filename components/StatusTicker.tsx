"use client";

/*
 * Honest loading status — shows the actual operation underway.
 * Anti-slop rule: no generic spinner with "Working on it!". Each step name
 * is the real backend operation. See docs/ANTI_SLOP.md rule 8.
 */

export type StatusTickerProps = {
  steps: string[];
  /** Index of the step currently in progress. Use -1 for none. */
  current: number;
};

export default function StatusTicker({ steps, current }: StatusTickerProps) {
  return (
    <ul className="flex flex-col gap-1 text-base">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li
            key={s}
            className={
              done
                ? "text-text-muted"
                : active
                  ? "text-text"
                  : "text-text-muted/60"
            }
          >
            <span className="mr-2 inline-block w-4">
              {done ? "✓" : active ? "→" : " "}
            </span>
            {s}
          </li>
        );
      })}
    </ul>
  );
}
