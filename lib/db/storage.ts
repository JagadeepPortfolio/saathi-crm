// Storage helpers for intake artifacts (audio + photo).
// Both buckets are private; we keep object paths and load via signed URLs.

import { db, PILOT_SHOP_ID } from "./client";

export type StoredObject = {
  bucket: "intake-photos" | "intake-audio";
  path: string;
};

export async function uploadAudio(
  bytes: Buffer | Uint8Array,
  contentType: string
): Promise<StoredObject> {
  const path = `${PILOT_SHOP_ID}/${Date.now()}-${randomSuffix()}.audio`;
  const { error } = await db()
    .storage.from("intake-audio")
    .upload(path, bytes, { contentType, upsert: false });
  if (error) throw new Error(`uploadAudio failed: ${error.message}`);
  return { bucket: "intake-audio", path };
}

export async function uploadPhoto(
  bytes: Buffer | Uint8Array,
  contentType: string
): Promise<StoredObject> {
  const path = `${PILOT_SHOP_ID}/${Date.now()}-${randomSuffix()}.image`;
  const { error } = await db()
    .storage.from("intake-photos")
    .upload(path, bytes, { contentType, upsert: false });
  if (error) throw new Error(`uploadPhoto failed: ${error.message}`);
  return { bucket: "intake-photos", path };
}

export async function signedUrl(
  obj: StoredObject,
  expiresInSec = 3600
): Promise<string> {
  const { data, error } = await db()
    .storage.from(obj.bucket)
    .createSignedUrl(obj.path, expiresInSec);
  if (error || !data) throw new Error(`signedUrl failed: ${error?.message}`);
  return data.signedUrl;
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 10);
}
