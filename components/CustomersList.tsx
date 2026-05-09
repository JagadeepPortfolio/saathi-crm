"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { customerStatus, type Customer } from "@/lib/types";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "today", label: "Today" },
  { id: "lapsed", label: "Lapsed" },
  { id: "repeat", label: "Repeat" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

export default function CustomersList({
  customers,
  initialFilter,
}: {
  customers: Customer[];
  initialFilter: string;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterId>(
    (FILTERS.find((f) => f.id === initialFilter)?.id ?? "all") as FilterId
  );

  const filtered = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lapsedCutoff = Date.now() - 60 * 86_400_000;
    const q = query.trim().toLowerCase();

    return customers.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q) && !(c.phone ?? "").includes(q)) {
        return false;
      }
      switch (filter) {
        case "today":
          return new Date(c.first_visit_at).getTime() >= today.getTime();
        case "lapsed":
          return new Date(c.last_visit_at).getTime() < lapsedCutoff;
        case "repeat":
          return (c.visit_count ?? 0) >= 2;
        default:
          return true;
      }
    });
  }, [customers, query, filter]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="px-5 py-3">
        <div className="flex items-center gap-2 rounded-button border border-border bg-surface px-3">
          <Search size={18} className="text-text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            aria-label="Search customers"
            className="h-12 w-full bg-transparent text-base text-text outline-none"
          />
        </div>
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-3">
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`h-9 shrink-0 rounded-full px-3 text-base ${
                active
                  ? "bg-primary text-white"
                  : "border border-border bg-surface text-text"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <ul className="flex flex-1 flex-col gap-px overflow-hidden">
        {filtered.length === 0 ? (
          <li className="px-5 py-6 text-base text-text-muted">No customers match.</li>
        ) : (
          filtered.map((c) => {
            const status = customerStatus(c);
            const dot =
              status === "lapsed"
                ? "bg-accent"
                : status === "amber"
                  ? "bg-primary"
                  : "bg-success";
            return (
              <li key={c.id} className="border-t border-border first:border-t-0">
                <Link
                  href={`/customers/${c.id}`}
                  className="flex items-center justify-between gap-3 bg-surface px-5 py-3 active:bg-surface-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-text">
                      {c.name}
                    </p>
                    <p className="truncate text-base text-text-muted">
                      {c.phone ?? "no phone"} ·{" "}
                      {new Date(c.last_visit_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                  <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
                </Link>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
