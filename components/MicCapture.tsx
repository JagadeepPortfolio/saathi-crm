"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";

export type MicCaptureProps = {
  onRecorded: (blob: Blob, durationSec: number) => void;
  maxSeconds?: number;
};

const MIME_CANDIDATES = [
  "audio/mp4",
  "audio/mpeg",
  "audio/webm;codecs=opus",
  "audio/webm",
];

function pickMime(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  for (const m of MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return undefined;
}

export default function MicCapture({ onRecorded, maxSeconds = 30 }: MicCaptureProps) {
  const [state, setState] = useState<"idle" | "recording">("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      stopStream();
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function start() {
    setError(null);
    if (state !== "idle") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickMime();
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const durationSec = (Date.now() - startTimeRef.current) / 1000;
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/mp4",
        });
        chunksRef.current = [];
        stopStream();
        onRecorded(blob, durationSec);
      };
      recorderRef.current = recorder;
      startTimeRef.current = Date.now();
      recorder.start();
      setState("recording");
      setSeconds(0);
      tickRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setSeconds(elapsed);
        if (elapsed >= maxSeconds) stop();
      }, 200);
    } catch (e) {
      setError(
        e instanceof Error && e.name === "NotAllowedError"
          ? "Mic permission denied. Open Settings → Safari → Microphone to allow."
          : `Could not start mic: ${e instanceof Error ? e.message : "unknown"}`
      );
    }
  }

  function stop() {
    if (state !== "recording") return;
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    recorderRef.current?.stop();
    setState("idle");
  }

  return (
    <div className="flex w-full flex-col items-center gap-4 py-8">
      {error && (
        <p className="rounded-card border border-accent/40 bg-surface-2 px-4 py-3 text-base text-accent">
          {error}
        </p>
      )}
      {state === "idle" && (
        <button
          type="button"
          onClick={start}
          className="flex h-32 w-32 items-center justify-center rounded-full bg-primary text-white shadow-lg active:bg-primary-700"
          aria-label="Tap to record"
        >
          <Mic size={48} />
        </button>
      )}
      {state === "recording" && (
        <button
          type="button"
          onClick={stop}
          className="flex h-32 w-32 items-center justify-center rounded-full bg-accent text-white shadow-lg active:opacity-80"
          aria-label="Tap to stop"
        >
          <Square size={40} fill="currentColor" />
        </button>
      )}
      <p className="text-2xl font-semibold tabular-nums text-text">
        {state === "recording"
          ? `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`
          : "Tap to record"}
      </p>
      {state === "recording" && (
        <p className="text-base text-text-muted">Speak in Telugu, Hindi, or English</p>
      )}
    </div>
  );
}
