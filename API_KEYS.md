# Getting AI model keys (free and paid)

Nimbus can talk to many providers at once. Every provider you add a key for shows up in the **model picker** under the message box, so users can switch between them in one chat. You need **at least one** key.

> **Free tiers change often.** The limits below are what was published when this was written. Check each provider's dashboard for today's numbers. Free tiers are for light use. If a provider says a free plan may use your data to improve its products (Google and Mistral's free plans do), don't send private or customer data through it.

## How adding a key works (same for every provider)

1. Create the key on the provider's website (steps below).
2. Put it in an **environment variable** with the exact name shown. On your computer that's a `.env` file (copy `.env.example`). On Render / Fly / Railway / Docker it's the host's "Environment" or "Secrets" screen. **Never paste keys into code or commit them to GitHub.**
3. Restart the app. Open the model picker: the provider's models appear.

Run `nimbus models` to see what's configured, and `nimbus models --discover` to ask each provider which model names your key may use (provider model names change; this fixes "model not found" errors).

## Free options

| Provider | Variable | Where to get it | Notes |
|---|---|---|---|
| **Google Gemini** | `GEMINI_API_KEY` | https://aistudio.google.com/app/apikey (sign in with Google, "Create API key") | Free tier with rate limits. Good all-rounder, handles images. Free-tier data may be used by Google to improve products. |
| **Groq** | `GROQ_API_KEY` | https://console.groq.com/keys | Very fast open models (gpt-oss etc.). Free plan, no card. Daily request/token limits. |
| **OpenRouter** | `OPENROUTER_API_KEY` | https://openrouter.ai/keys | One key, many models. Models whose id ends in `:free` cost nothing (daily request cap; higher if you add a few dollars of credit). Default model: `openrouter/free`. |
| **Mistral** | `MISTRAL_API_KEY` | https://console.mistral.ai (choose the free "Experiment" plan; phone verification) | Free plan may use your data for training. |
| **Ollama** (your own computer) | `OLLAMA_BASE_URL=http://localhost:11434/v1` | https://ollama.com, then `ollama pull llama3.1` | Completely free and private, but needs a decent computer, and a cloud host usually can't reach your laptop. |

## Paid options (best quality)

| Provider | Variable | Where |
|---|---|---|
| **Anthropic (Claude)** | `ANTHROPIC_API_KEY` | https://console.anthropic.com. Add a few dollars of credit; **set a monthly spend limit**. |
| **OpenAI** | `OPENAI_API_KEY` | https://platform.openai.com. Same advice. |

## Any other OpenAI-compatible service ("Custom")

Cerebras, Together, DeepSeek, Fireworks, LM Studio, vLLM and many more speak the same protocol. Use the Custom slot:

```
NIMBUS_CUSTOM_BASE_URL=https://api.cerebras.ai/v1
NIMBUS_CUSTOM_API_KEY=your-key
NIMBUS_CUSTOM_MODELS=model-id-1,model-id-2
NIMBUS_CUSTOM_LABEL=Cerebras
```

Find the base URL and model ids in that provider's docs.

## Choosing defaults

- `NIMBUS_PROVIDER=gemini` makes Gemini the default. Without it, the first provider with a key wins.
- `NIMBUS_<PROVIDER>_MODELS=a,b,c` replaces a provider's model list, e.g. `NIMBUS_GEMINI_MODELS=gemini-flash-latest,gemini-pro-latest`.
- Model names are starting points. If one is retired you'll see a "model or endpoint not found" message; run `nimbus models --discover` and update the list.

## Images

`generate_image` works in two ways:

- **OpenAI-compatible images API** (best quality, paid): set `NIMBUS_IMAGE_API_KEY` (or just `OPENAI_API_KEY`). Model: `NIMBUS_IMAGE_MODEL` (default `gpt-image-1`).
- **Hugging Face** (free, recommended for images): create a token at https://huggingface.co/settings/tokens ("Read" is enough) and set `HF_TOKEN`. Nimbus tries your Gemini key, then Hugging Face, then Pollinations.
- **Pollinations** (free fallback, used when no image key is set): works without a key but is rate-limited and may add a watermark; a free key from https://enter.pollinations.ai (`POLLINATIONS_API_KEY`) improves reliability.

Gemini's free text key does not generate images. Each user is capped at `NIMBUS_IMAGE_DAILY_LIMIT` images a day (default 20) so nobody can run up your bill.

## Better web search (optional)

Without a key Nimbus searches DuckDuckGo. For more reliable results get a Brave Search API key at https://api.search.brave.com and set `BRAVE_API_KEY`.

## Protect your wallet

- Set a **spending limit** in every paid provider console.
- Keep `NIMBUS_DAILY_LIMIT` (messages per user per day) modest, and `NIMBUS_ALLOW_SIGNUP=0` or an `NIMBUS_SIGNUP_CODE` if you don't want strangers using your keys.
- If a key ever leaks, delete it in the provider console and create a new one.
