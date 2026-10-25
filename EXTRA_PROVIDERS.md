# Adding more free AI models (no coding)

Nimbus already knows these: Gemini, Groq, Cerebras, OpenRouter, NVIDIA, SambaNova, Mistral, Cohere,
GitHub Models, Hugging Face (plus OpenAI / Claude if you ever pay). For any of them: add the key in
Render > Environment and it switches on by itself.

| Provider | Render variable name |
|---|---|
| Cerebras | CEREBRAS_API_KEY |
| NVIDIA | NVIDIA_API_KEY |
| SambaNova | SAMBANOVA_API_KEY |
| Cohere | COHERE_API_KEY |
| GitHub Models | GITHUB_MODELS_TOKEN |
| Hugging Face | HF_TOKEN |
| Mistral | MISTRAL_API_KEY |

## A brand-new one that Nimbus has never heard of
1. Find 3 things in that service's docs: the API address (base URL, usually ends in /v1), a model name, and your key.
   It must be "OpenAI-compatible".
2. On GitHub, open `extra_providers.example.json`, copy it, and upload a new file named `extra_providers.json`
   with your real values. Add as many blocks as you want.
2b. Or, with no upload: in Render > Environment add `NIMBUS_EXTRA_PROVIDERS` and paste the whole JSON as its value.
3. In Render > Environment add the key under the name you wrote in `key_env`.
4. Redeploy. Open Settings > Models: the new one is there. If the file has a mistake, that block is
   skipped and nothing breaks; the app still starts with the others.
