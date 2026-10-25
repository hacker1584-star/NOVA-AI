# Nimbus 3.0 audit: your brief, item by item

Status words: DONE (built and tested here with fakes), EXISTED (was already in Nimbus; checked), CHANGED (different from the brief for a stated reason), BLOCKED (needs something from you), NOT DONE.

| Brief item | Status | What is true |
|---|---|---|
| GSAP | DONE, real file not tested | Used for the Home screen, greeting and panel entrances. Render downloads it at build time (`fetch_vendor.py`). Tested here with a stand-in file. ScrollTrigger is not used: Nimbus is an app, not a long scrolling page. |
| Lenis | DONE, real file not tested | Smooths scrolling only inside the side panel, desktop mouse only. Never the chat, never touch. Off for reduced motion. |
| React Bits | NOT DONE (honest) | It is React-only (MIT + Commons Clause). Nimbus has no React and no build step. I hand-wrote one similar effect (pointer spotlight on cards). It is not the library. |
| Professional design | DONE | `polish.css`: calmer surfaces, one corner style, flat cards, solid greeting, better light and dark, reduced-motion support. |
| Inventory of capabilities | EXISTED | 81 tools, modes, providers with fallback, streaming, edit/regenerate, files, artifacts, Studio, workflows, agent tasks. |
| Retry controls | EXISTED | "Try again" button on failed answers. |
| Keep drafts after a failure | DONE (new) | If sending fails, your typed message is put back in the box. |
| Duplicate submissions | EXISTED | Sending is blocked while a reply is streaming. |
| Context limits | EXISTED, simple | Chat history is trimmed to the last N messages (`max_history`). It counts messages, not tokens. |
| Provider fallback, timeouts, rate limits | EXISTED | Silent switching with cooldowns; tested with fake failures only. |
| Email sign-up, login, logout, sessions | EXISTED | Tested. Email verification works once you add Brevo (`EMAIL_SETUP.md`). |
| Forgot password with a real link | CHANGED | Nimbus emails a 6-digit code (not a link) and also offers a recovery key that works with no email at all. Same safety, simpler on phones. Generic replies are used so nobody can tell which emails have accounts (except when email is off). |
| Google sign-in | EXISTED, BLOCKED | Real OAuth. Needs your Google keys (`AUTH_SETUP.md` section 2). |
| GitHub sign-in | EXISTED, BLOCKED | Needs your GitHub keys (section 2b). |
| Phone OTP | EXISTED, BLOCKED (on purpose) | Disabled until Twilio is set up. Twilio is paid, so it stays off unless you approve. |
| Use a maintained auth service, no custom password database | CHANGED | Nimbus uses its own accounts with scrypt hashing (a standard, maintained algorithm from Python). Supabase is not used: it would mean moving all data to a second service. |
| Persistent memory: "my name is Daniel" across chats | DONE, tested | A new chat receives the account name and saved facts. Tested: a second user never sees them. The model saves facts itself with the `remember` tool, or you add them by hand. Whether a real model chooses to call `remember` was not tested live. |
| Memory controls: view, edit, delete, clear all, turn off | DONE (new) | Memory panel now has a name box, edit, delete, clear all (needs confirmation) and an on/off switch, plus a plain explanation of what is stored. |
| No secrets in memory | DONE (new) | Anything that looks like a password, API key or token is refused, by the tool, the Add box and the edit box. It is a pattern check, so unusual secrets could slip through. |
| Remembering other chats | NOT DONE (by design) | Only the saved facts carry over, not old chat text. This matches the brief's warning not to assume it. |
| Supabase Row Level Security | CHANGED | Not applicable: there is no browser-to-database connection. Every request goes through the server, which checks ownership. Tested by attack in `SECURITY_REPORT.md`. |
| Security basics (keys on server, headers, limits, no secrets in logs, prompt-injection approvals, no unsandboxed code) | DONE / EXISTED | See `SECURITY_REPORT.md`. Code execution is off by default. |
| Migrations | EXISTED | Tables are created and upgraded automatically at start-up; nothing was dropped. |
| Free-tier first | DONE | No paid service added. Brevo (300 emails/day) is optional. |

## Tests (what was really run)

Passed (automatic, in this sandbox, with fake model providers): 226 tests, including account isolation, memory across chats, memory edit/clear/off, secret refusal, attack scenarios, limits and caps, agent tasks, static files, packaging. Browser tests with a phone-size and a desktop window: Home screen, panels, chat reply rendering, memory panel, draft restore, light and dark themes, with and without the animation files, and with reduced motion.

Not tested: the live Render site, real model providers, provider timeouts and rate limits with real services, real GSAP and Lenis files, deployment build on Render.

Blocked by missing configuration: Google sign-in, GitHub sign-in, phone codes, Brevo email delivery.
