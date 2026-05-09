"""
Saathi inference — Modal serverless backup for the Mac-local Ollama.

Wraps Ollama inside a Modal container with persistent model volume so cold
start only pulls the model the first time. Exposes a FastAPI endpoint that
mirrors Ollama's /api/chat surface so the TypeScript modalAdapter can use
the same request shape.

Deploy:
    pip install modal
    modal token new
    modal deploy modal/saathi_inference.py

Modal returns a URL like:
    https://<workspace>--saathi-inference-saathiinference-api-chat.modal.run

Set that as MODAL_GEMMA_URL in the Vercel project env, plus AI_MODE=modal.

Cost: A10G is ~$1.10/hr active, $0 idle (scaledown_window=300s).
For demo-volume traffic, expect <$5/month in this configuration.
"""

import modal

GEMMA_TAG = "gemma4:e4b"

VOLUME = modal.Volume.from_name("saathi-models", create_if_missing=True)
MODELS_DIR = "/models"

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("curl", "ca-certificates")
    .run_commands(
        "curl -fsSL https://ollama.com/install.sh | sh",
    )
    .pip_install("fastapi", "httpx", "uvicorn")
    .env({"OLLAMA_MODELS": MODELS_DIR, "OLLAMA_HOST": "127.0.0.1:11434"})
)

app = modal.App("saathi-inference", image=image)


@app.cls(
    gpu="A10G",
    volumes={MODELS_DIR: VOLUME},
    timeout=600,
    scaledown_window=300,
    min_containers=0,
)
class SaathiInference:
    """Long-lived warm worker. Cold start ~30s once the model is in volume."""

    @modal.enter()
    def boot(self):
        import os
        import subprocess
        import time

        os.environ["OLLAMA_MODELS"] = MODELS_DIR

        self.proc = subprocess.Popen(
            ["ollama", "serve"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        # Give ollama a couple of seconds to start.
        for _ in range(20):
            try:
                import httpx

                httpx.get("http://127.0.0.1:11434/api/version", timeout=2)
                break
            except Exception:
                time.sleep(0.5)

        # Pull only if not already in the persistent volume.
        list_out = subprocess.run(
            ["ollama", "list"], capture_output=True, text=True
        ).stdout
        if GEMMA_TAG not in list_out:
            subprocess.run(["ollama", "pull", GEMMA_TAG], check=True)
            VOLUME.commit()

    @modal.exit()
    def shutdown(self):
        try:
            self.proc.terminate()
        except Exception:
            pass

    @modal.fastapi_endpoint(method="POST", docs=False)
    def chat(self, payload: dict):
        """Mirror of Ollama's /api/chat. The TypeScript adapter posts here."""
        import httpx

        with httpx.Client(timeout=120) as client:
            r = client.post(
                "http://127.0.0.1:11434/api/chat",
                json=payload,
            )
            r.raise_for_status()
            return r.json()


# A standalone smoke test you can run locally before deploy:
#   modal run modal/saathi_inference.py
@app.local_entrypoint()
def smoke():
    import httpx
    import json

    inference = SaathiInference()
    body = {
        "model": GEMMA_TAG,
        "stream": False,
        "think": False,
        "messages": [
            {"role": "user", "content": "Say hello in Telugu, one short sentence."}
        ],
    }
    out = inference.chat.remote(body)
    print(json.dumps(out, ensure_ascii=False, indent=2))
