# Nimbus

A multi-user, multi-model AI assistant you host yourself. Everyone gets their own account; the assistant doesn't just chat, it **researches, writes documents, builds spreadsheets and interactive apps, analyzes data, generates images, runs code, schedules work and emails you the results.**

- **Accounts for everyone.** Sign up with email, **Google**, or **phone number (SMS code)**. Private chats, files, memory and settings per person; API keys; delete-my-data.
- **Many models, one picker.** Gemini, Groq, OpenRouter, Mistral (free tiers available), Claude, OpenAI, Ollama, or any OpenAI-compatible service. See [API_KEYS.md](API_KEYS.md).
- **57+ tools**, including the advanced ones:

| Group | Tools |
|---|---|
| Agents & automation | `deep_research` (plans searches, reads sources, writes a cited report), `plan` (live checklist), `schedule` (one-off and repeating tasks that run on their own), `email_me` |
| Create | `create_document` (Word / PDF / HTML), `create_spreadsheet` (Excel with formulas), `create_artifact` (interactive pages, games, charts, SVG in a sandboxed preview panel), `generate_image`, `create_ics` (calendar files) |
| Math & data | `run_python` code interpreter (optional), `sql_query` over uploaded CSVs, `csv_summary`, `calculator`, `stats`, `convert_units`, `text_diff`, `color_convert` |
| Files | upload PDFs, Word, Excel, PowerPoint, images (vision), `read_document`, plus read/write/edit/search in a private per-user workspace |
| Web & live data | `web_search`, `fetch_url` (pages and PDFs), `download_file`, `rss_read`, `weather`, `wikipedia`, `arxiv_search`, `github_repo`, `crypto_price`, `country_info`, `convert_currency`, `hacker_news`, and more |
| Memory & notes | long-term `remember`/`forget`, custom instructions, `todo`, `notes` |

- **Premium interface.** Sky that follows your local time, streaming replies, tool steps, plan cards, file cards, live preview panel, dark/light, mobile layout, voice dictation and read-aloud, drag-and-drop and paste for images and files, chat search, rename, export, regenerate.
- **Safe by design.** Passwords hashed with scrypt; sessions stored hashed; login/SMS/email throttles; cross-site request blocking; strict Content-Security-Policy; each user's files isolated; uploads and artifacts sandboxed; the web fetcher blocks private addresses; per-user daily and storage limits.

## Run it on your computer (2 minutes)

```bash
git clone https://github.com/YOUR_USER/nimbus-assistant && cd nimbus-assistant
pip install -e .                       # Python 3.10+
export GEMINI_API_KEY=your-free-key    # or GROQ_API_KEY, etc. (API_KEYS.md)
NIMBUS_AUTH=none nimbus serve          # single-user mode, no login. Open http://127.0.0.1:8000
```

Drop `NIMBUS_AUTH=none` to get the real sign-up / log-in screen. Other commands: `nimbus chat`, `nimbus ask "..."`, `nimbus tools`, `nimbus models [--discover]`, `nimbus adduser EMAIL`, `nimbus passwd EMAIL`.

## Put it online

[DEPLOY.md](DEPLOY.md) (Render, Fly.io, VPS + HTTPS, safety checklist) · [API_KEYS.md](API_KEYS.md) (free keys) · [AUTH_SETUP.md](AUTH_SETUP.md) (Google, SMS, email).

## Configuration

Everything is an environment variable; see [.env.example](.env.example) for the full annotated list.

## HTTP API

Create a key in Settings → API keys, then:

```bash
curl -N https://YOUR-SITE/api/chat -H "Authorization: Bearer nmk_..." -H "Content-Type: application/json" \
  -d '{"message": "Summarize the latest news about solar power", "model": "gemini:gemini-flash-latest"}'
```

The reply is a server-sent-event stream: `conversation`, `text`, `tool_call`, `tool_result`, `plan`, `file`, `progress`, `error`, `done`. Other routes: `/api/conversations`, `/api/upload`, `/api/files/...`, `/api/models`, `/api/tools`, `/api/schedules`, `/api/health`.

## Add your own tool

```python
# in nimbus/tools/advanced.py (or a new module registered from builtin.build_registry)
@reg.tool("shout", "Uppercase some text.", {"text": {"type": "string"}}, ["text"])
async def shout(text: str) -> str:
    return text.upper()
```

Tools receive the per-user `ctx` (user id, private workspace, memory, timezone). Return text; exceptions are reported to the model, never crash the chat. Use `ctx.emit(type="file", ...)` to show a file card.

## Honest limits

- Free model tiers have rate limits and change; models get renamed (use `nimbus models --discover`).
- One server process with SQLite is meant for personal use up to a few hundred active users, not a huge public service.
- `run_python` is a convenience, not a security sandbox. Leave it off for public deployments or run Nimbus inside a disposable container.
- Prompt injection from web pages and files can't be fully prevented; Nimbus labels such content as untrusted, but don't connect it to anything you can't afford to have misused.
- Google sign-in, SMS and email sending depend on your own accounts with those services and were tested here only against stand-ins, so do a real test after setup.

## Development

```bash
pip install -e ".[dev]" && pytest
```

CI runs the suite on Python 3.10-3.13. MIT licensed.
