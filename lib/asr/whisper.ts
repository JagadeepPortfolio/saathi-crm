// Server-side ASR via whisper.cpp (whisper-cli binary).
// Picks language hint, returns transcript text.
// See docs/GEMMA_INTEGRATION.md for why we use whisper.cpp + large-v3-turbo:
//   - mature Indic support (~85% accuracy on Telugu code-mix in tests)
//   - 1.5GB Q4 model fits comfortably on a Mac alongside Gemma 4 8B
//   - Gemma 4's native audio path was unreliable through Ollama 0.20.2

import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const DEFAULT_MODEL =
  process.env.WHISPER_MODEL_PATH ||
  resolve(process.cwd(), "models/ggml-large-v3-turbo.bin");

const WHISPER_BIN = process.env.WHISPER_BIN || "whisper-cli";
const FFMPEG_BIN = process.env.FFMPEG_BIN || "ffmpeg";

export type TranscribeInput = {
  audioBytes: Buffer;
  /** ISO language hint passed to whisper. "te" / "hi" / "en". */
  language: "te" | "hi" | "en";
};

export type TranscribeResult = {
  text: string;
  language: "te" | "hi" | "en";
  /** Wall-clock milliseconds for ASR (excluding ffmpeg conversion). */
  ms: number;
};

export async function transcribe({
  audioBytes,
  language,
}: TranscribeInput): Promise<TranscribeResult> {
  const dir = await mkdtemp(join(tmpdir(), "saathi-asr-"));
  const inputPath = join(dir, "in.audio");
  const wavPath = join(dir, "in.wav");
  const outPrefix = join(dir, "out");

  try {
    await writeFile(inputPath, audioBytes);
    await run(FFMPEG_BIN, [
      "-y",
      "-i",
      inputPath,
      "-ar",
      "16000",
      "-ac",
      "1",
      "-c:a",
      "pcm_s16le",
      wavPath,
    ]);

    const t0 = Date.now();
    await run(WHISPER_BIN, [
      "-m",
      DEFAULT_MODEL,
      "-l",
      language,
      "-f",
      wavPath,
      "--output-txt",
      "-nt",
      "-np",
      "-of",
      outPrefix,
      "-t",
      "8",
    ]);
    const ms = Date.now() - t0;

    const text = (await readFile(`${outPrefix}.txt`, "utf8")).trim();
    return { text, language, ms };
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

function run(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolveProcess, reject) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    p.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    p.on("close", (code) => {
      if (code === 0) resolveProcess();
      else reject(new Error(`${cmd} exited ${code}: ${stderr.slice(0, 400)}`));
    });
    p.on("error", (err) => reject(err));
  });
}
