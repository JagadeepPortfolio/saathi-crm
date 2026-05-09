import { NextResponse } from "next/server";
import type { VisitPatch } from "@/lib/db/visits";
import { patchVisit } from "@/lib/db/visits";

export const runtime = "nodejs";

const ALLOWED = ["services", "amount_inr", "notes", "next_visit_hint"] as const;

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json()) as Record<string, unknown>;

    const patch: VisitPatch = {};
    for (const key of ALLOWED) {
      if (key in body) (patch as Record<string, unknown>)[key] = body[key];
    }
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "no allowed fields in body" }, { status: 400 });
    }

    if ("services" in patch) {
      if (!Array.isArray(patch.services))
        return NextResponse.json({ error: "services must be string[]" }, { status: 400 });
      patch.services = (patch.services as unknown[])
        .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
        .map((s) => s.trim());
    }
    if ("amount_inr" in patch) {
      const n = Number(patch.amount_inr);
      if (!Number.isFinite(n) || n < 0)
        return NextResponse.json({ error: "amount_inr must be a non-negative number" }, { status: 400 });
      patch.amount_inr = n;
    }

    const updated = await patchVisit(id, patch);
    return NextResponse.json({ visit: updated }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error("[visits PATCH] failed:", msg);
    return NextResponse.json({ error: "patch_failed", message: msg.slice(0, 300) }, { status: 500 });
  }
}
