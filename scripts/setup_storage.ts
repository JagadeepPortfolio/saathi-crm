/**
 * One-shot script: ensures Supabase Storage buckets exist with the right config.
 * Idempotent — safe to run repeatedly.
 *
 *   npx tsx scripts/setup_storage.ts
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type BucketSpec = {
  id: string;
  fileSizeLimit: number;
  allowedMimeTypes: string[];
};

const BUCKETS: BucketSpec[] = [
  {
    id: "intake-photos",
    fileSizeLimit: 10 * 1024 * 1024, // 10 MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/heic"],
  },
  {
    id: "intake-audio",
    fileSizeLimit: 25 * 1024 * 1024, // 25 MB
    allowedMimeTypes: [
      "audio/mp4",
      "audio/m4a",
      "audio/x-m4a",
      "audio/mpeg",
      "audio/wav",
      "audio/webm",
      "audio/ogg",
    ],
  },
];

async function ensureBucket(spec: BucketSpec) {
  const { data: existing } = await sb.storage.getBucket(spec.id);
  if (existing) {
    const { error } = await sb.storage.updateBucket(spec.id, {
      public: false,
      fileSizeLimit: spec.fileSizeLimit,
      allowedMimeTypes: spec.allowedMimeTypes,
    });
    if (error) throw error;
    console.log(`  · updated  ${spec.id}`);
    return;
  }
  const { error } = await sb.storage.createBucket(spec.id, {
    public: false,
    fileSizeLimit: spec.fileSizeLimit,
    allowedMimeTypes: spec.allowedMimeTypes,
  });
  if (error) throw error;
  console.log(`  + created  ${spec.id}`);
}

async function main() {
  console.log(`Supabase: ${url}`);
  for (const b of BUCKETS) {
    await ensureBucket(b);
  }
  const { data, error } = await sb.storage.listBuckets();
  if (error) throw error;
  console.log("\nbuckets present:");
  for (const b of data || []) {
    console.log(`  - ${b.id} (public=${b.public}, size_limit=${b.file_size_limit ?? "default"})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
