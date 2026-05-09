"use client";

import { useRef, useState } from "react";
import { Camera, X } from "lucide-react";

export type PhotoCaptureProps = {
  onPicked: (file: File | null) => void;
};

export default function PhotoCapture({ onPicked }: PhotoCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreview(url);
      onPicked(f);
    } else {
      setPreview(null);
      onPicked(null);
    }
  }

  function clear() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFile(null);
    onPicked(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePick}
        className="hidden"
      />
      {!preview ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-button border border-border bg-surface text-base text-text active:bg-surface-2"
        >
          <Camera size={18} />
          Add Photo
        </button>
      ) : (
        <div className="relative overflow-hidden rounded-card border border-border bg-surface">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Car preview" className="w-full object-cover" />
          <button
            type="button"
            onClick={clear}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-surface/95 text-text shadow"
            aria-label="Remove photo"
          >
            <X size={18} />
          </button>
          <p className="px-4 py-2 text-base text-text-muted">
            {file?.name ?? "photo"}
          </p>
        </div>
      )}
    </div>
  );
}
