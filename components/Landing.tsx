// Marketing landing page shown at https://saathi-crm.vercel.app
// Gated on LANDING_MODE=1 — local dev renders the Today screen instead.
// Single source of truth for the project's public face. Pure static, no DB.

import Link from "next/link";

const REPO = "https://github.com/JagadeepPortfolio/saathi-crm";
const VIDEO = "https://youtu.be/0w4-KMMX_6o";
const WRITEUP = `${REPO}/blob/main/docs/KAGGLE_WRITEUP.md`;

export default function Landing() {
  return (
    <main className="min-h-dvh bg-bg text-text">
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pt-16 pb-12 sm:px-10 sm:pt-24">
        <span className="inline-block rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-700">
          Gemma 4 · Digital Equity
        </span>
        <h1 className="mt-6 text-5xl font-extrabold leading-none tracking-tight sm:text-7xl">
          Saathi
        </h1>
        <div className="mt-5 h-1.5 w-20 rounded-full bg-primary" />
        <p className="mt-7 max-w-3xl text-2xl font-medium leading-tight text-text sm:text-3xl">
          Voice-first CRM for Indian MSMEs, built on Gemma 4.
        </p>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-text-muted">
          A 10-second Telugu voice note becomes a tracked customer plus an
          AI-drafted WhatsApp follow-up — approved and sent in one tap.
          Apache 2.0. <span className="font-semibold text-text">$0 per shop, per month.</span>
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={VIDEO}
            target="_blank"
            rel="noreferrer"
            className="rounded-button bg-primary px-5 py-3 text-base font-semibold text-white active:bg-primary-700"
          >
            Watch the 90s demo
          </a>
          <a
            href={REPO}
            target="_blank"
            rel="noreferrer"
            className="rounded-button border border-border bg-surface px-5 py-3 text-base font-semibold text-text active:bg-surface-2"
          >
            View code
          </a>
          <a
            href={WRITEUP}
            target="_blank"
            rel="noreferrer"
            className="rounded-button border border-border bg-surface px-5 py-3 text-base font-semibold text-text active:bg-surface-2"
          >
            Read write-up
          </a>
        </div>
      </section>

      {/* Demo video */}
      <section className="mx-auto max-w-5xl px-6 pb-12 sm:px-10">
        <div
          className="relative w-full overflow-hidden rounded-card border border-border bg-surface"
          style={{ aspectRatio: "16 / 9" }}
        >
          <iframe
            className="absolute inset-0 h-full w-full"
            src="https://www.youtube.com/embed/0w4-KMMX_6o"
            title="Saathi demo"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </section>

      {/* Screenshots */}
      <section className="mx-auto max-w-5xl px-6 py-12 sm:px-10">
        <h2 className="text-3xl font-bold text-text">What the owner sees</h2>
        <p className="mt-3 max-w-3xl text-base text-text-muted">
          Same React PWA running on iOS Safari, Android Chrome, and any
          desktop browser. Captured at 390 × 844 px — the iPhone 15 Pro
          viewport — so judges can clone the repo and reproduce every pixel.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Shot src="/screenshots/today.png" label="Today" />
          <Shot src="/screenshots/record.png" label="Voice intake" />
          <Shot src="/screenshots/customer-detail.png" label="Customer detail" />
          <Shot src="/screenshots/draft-review.png" label="Draft Review with live tool-call trace" />
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-6 py-12 sm:px-10">
        <h2 className="text-3xl font-bold text-text">How Gemma 4 powers the loop</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          <Pillar
            n="1"
            title="Multimodal intake"
            body="Owner speaks 8 seconds in Telugu and photographs the car. whisper.cpp transcribes; Gemma 4 reads transcript + photo together and extracts the license plate, services, and amount."
          />
          <Pillar
            n="2"
            title="Native function calling"
            body="Every customer write is a Gemma 4 tool call — customer.create or customer.update — emitted by the model. The ?demo=1 flag shows the live trace in the UI."
          />
          <Pillar
            n="3"
            title="Multilingual generation"
            body="One tap drafts a 2–4 sentence follow-up in the customer's preferred language (Telugu, Hindi, English). Owner edits a word, taps Send. Real WhatsApp via Twilio."
          />
        </div>
      </section>

      {/* Capability honesty */}
      <section className="mx-auto max-w-5xl px-6 py-12 sm:px-10">
        <h2 className="text-3xl font-bold text-text">Honest engineering</h2>
        <ul className="mt-6 space-y-4 text-base leading-relaxed text-text">
          <li className="rounded-card border border-border bg-surface p-5">
            <span className="font-semibold">ASR is whisper.cpp, not Gemma 4 native audio.</span>{" "}
            <span className="text-text-muted">
              Gemma 4 advertises audio input; via Ollama 0.20.2 it hallucinated a generic Telugu greeting. We use whisper-large-v3-turbo for Telugu code-mix (~85% WER).
            </span>
          </li>
          <li className="rounded-card border border-border bg-surface p-5">
            <span className="font-semibold">{`The think: false flag is mandatory.`}</span>{" "}
            <span className="text-text-muted">
              Without it, Gemma 4 burns the num_predict budget on a thinking field before emitting tool_calls. 30 minutes to find; documented in the repo.
            </span>
          </li>
          <li className="rounded-card border border-border bg-surface p-5">
            <span className="font-semibold">Desktop-viewport demo is deliberate.</span>{" "}
            <span className="text-text-muted">
              Same code on iOS Safari, Android Chrome, and desktop. We record at 390 × 844 px for reproducibility and tool-call-trace legibility. The owner-to-camera Telugu testimonial is filmed in the shop.
            </span>
          </li>
        </ul>
      </section>

      {/* Economics */}
      <section className="mx-auto max-w-5xl px-6 py-12 sm:px-10">
        <h2 className="text-3xl font-bold text-text">Why this scales</h2>
        <p className="mt-3 max-w-3xl text-base text-text-muted">
          $0 per shop is the only viable price for the bottom 90% of Indian MSMEs.
          A 1,000-shop region runs for under $1,500/month on Modal serverless.
        </p>
        <div className="mt-6 overflow-hidden rounded-card border border-border bg-surface">
          <table className="w-full text-left text-base">
            <thead className="bg-surface-2 text-text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Component</th>
                <th className="px-4 py-3 font-medium">Mac pilot</th>
                <th className="px-4 py-3 font-medium">Modal serverless</th>
              </tr>
            </thead>
            <tbody className="text-text">
              <Row a="Gemma 4 inference" b="$0" c="~$0.30/hr active, $0 idle" />
              <Row a="whisper.cpp" b="$0" c="bundled in Modal container" />
              <Row a="Supabase" b="$0 free tier" c="$0 (free tier headroom)" />
              <Row a="Vercel" b="$0" c="$0" />
              <Row a="Twilio (WhatsApp IN)" b="$0 sandbox" c="$0.005–0.01 per send" />
              <tr className="bg-surface-2 font-semibold">
                <td className="px-4 py-3">Total per shop / month</td>
                <td className="px-4 py-3">$0</td>
                <td className="px-4 py-3">$0.50–2</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Try locally */}
      <section className="mx-auto max-w-5xl px-6 py-12 sm:px-10">
        <h2 className="text-3xl font-bold text-text">Try Saathi locally</h2>
        <p className="mt-3 max-w-3xl text-base text-text-muted">
          The intake pipeline runs whisper.cpp and Gemma 4 as Mac-local subprocesses, so the
          full demo runs from a clone. Setup target: under 10 minutes.
        </p>
        <pre className="mt-5 overflow-x-auto rounded-card border border-border bg-surface p-5 text-sm leading-relaxed text-text">
{`git clone ${REPO.replace("https://", "")}
cd saathi-crm
npm install
cp .env.example .env.local       # fill Supabase + Twilio keys
brew install ollama whisper-cpp ffmpeg
ollama pull gemma4:e4b
npm run dev                       # open http://localhost:3000`}
        </pre>
        <p className="mt-4 text-sm text-text-muted">
          Full setup, env-var list, and the validation harness are in the{" "}
          <Link href={REPO} className="underline">repo README</Link>.
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-10 text-sm text-text-muted sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <div>
            <p className="text-base font-semibold text-text">Saathi</p>
            <p>Apache 2.0 · Built on Gemma 4 · For 63 million Indian MSMEs</p>
          </div>
          <div className="flex flex-wrap gap-5">
            <a href={REPO} target="_blank" rel="noreferrer" className="underline">GitHub</a>
            <a href={VIDEO} target="_blank" rel="noreferrer" className="underline">YouTube</a>
            <a href={WRITEUP} target="_blank" rel="noreferrer" className="underline">Write-up</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Shot({ src, label }: { src: string; label: string }) {
  return (
    <figure className="flex flex-col gap-2">
      <div className="overflow-hidden rounded-card border border-border bg-surface">
        <img src={src} alt={label} className="block h-auto w-full" />
      </div>
      <figcaption className="text-sm text-text-muted">{label}</figcaption>
    </figure>
  );
}

function Pillar({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="rounded-card border border-border bg-surface p-6">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary-700">
        {n}
      </span>
      <h3 className="mt-4 text-xl font-semibold text-text">{title}</h3>
      <p className="mt-2 text-base leading-relaxed text-text-muted">{body}</p>
    </div>
  );
}

function Row({ a, b, c }: { a: string; b: string; c: string }) {
  return (
    <tr className="border-t border-border">
      <td className="px-4 py-3">{a}</td>
      <td className="px-4 py-3 text-text-muted">{b}</td>
      <td className="px-4 py-3 text-text-muted">{c}</td>
    </tr>
  );
}
