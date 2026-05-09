import { NextResponse } from "next/server";
import type { CustomerPatch } from "@/lib/db/customers";
import { patchCustomer } from "@/lib/db/customers";

export const runtime = "nodejs";

const ALLOWED = ["name", "phone", "preferred_language", "notes"] as const;

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json()) as Record<string, unknown>;

    const patch: CustomerPatch = {};
    for (const key of ALLOWED) {
      if (key in body) (patch as Record<string, unknown>)[key] = body[key];
    }
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "no allowed fields in body" }, { status: 400 });
    }

    if ("name" in patch) {
      const n = (patch.name ?? "").toString().trim();
      if (!n) return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
      patch.name = n;
    }
    if ("phone" in patch) {
      const p = (patch.phone ?? "") === null ? null : String(patch.phone ?? "").trim() || null;
      if (p && !/^\+?\d{10,15}$/.test(p)) {
        return NextResponse.json({ error: "phone must be digits, optional + prefix" }, { status: 400 });
      }
      patch.phone = p;
    }

    const updated = await patchCustomer(id, patch);
    return NextResponse.json({ customer: updated }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error("[customers PATCH] failed:", msg);
    return NextResponse.json({ error: "patch_failed", message: msg.slice(0, 300) }, { status: 500 });
  }
}
