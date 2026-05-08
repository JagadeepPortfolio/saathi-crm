// ASR entry point. Currently a single backend (whisper.cpp local).
// Future: HF Inference Endpoint backend for stateless serverless deploy.

export { transcribe } from "./whisper";
export type { TranscribeInput, TranscribeResult } from "./whisper";
