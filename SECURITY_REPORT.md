# Nimbus security assessment (version 3.0.0, 21 Oct 2026)

Scope: the Nimbus code in this repository, tested as an owner-authorised review of your own project. I attacked a running copy with fake accounts (red-team method), then checked the design against OWASP Top 10:2025, OWASP Top 10 for LLM Applications 2025 and STRIDE.

Honest limits: this is a self-review by the author's assistant, not an independent penetration test. The sandbox has no internet, so real Google/GitHub sign-in, Brevo email, real model providers and the live Render server were not attacked. Anything marked "not tested live" needs a check on the real site.

## 1. Red-team results (attacks actually run)

| Attack tried | Result |
|---|---|
| Call all 141 endpoint/method pairs with no login | Only 17 public pages answered (home, status, sign-in callbacks, public AI pages). Everything else refused. |
| Second user reading, changing or deleting the first user's chats, files, Studio AIs, keys, leads, workflows, agent tasks, approvals | Blocked on all 36 routes tried. List pages did not leak the other user's items. |
| Folder escape on /api/files, /api/artifacts, /static, /static/vendor (plain, %2e%2e, encoded slashes, absolute paths, null byte) | Blocked. |
| Upload named `../../evil.py`, upload of an .html file | Name cleaned to `uploads/evil.py`; files download as attachments with a sandbox CSP, so they cannot run as a page. |
| Cross-site request forgery (foreign Origin, null Origin, cross-site fetch) | Blocked (403). A fake Bearer key got 401. |
| Guess a password 15 times | Locked out after 5 (429). |
| Guess a recovery key 14 times | Locked out after 5 (429). |
| Script injection through chat titles, Studio AI names and model replies containing `<script>` / `<img onerror>` | Escaped. Page output never contained a raw script tag. |
| SQL injection in paths and fields | No injection. All queries are parameterised; the few dynamic column/table names come from fixed internal lists. |
| Forged OAuth state on the Google and GitHub callbacks | Rejected (redirected away, nothing signed in). |
| 3 MB request body, bad JSON, TRACE method | 413, 400, 405. |
| Secrets in /api/config, /api/status, /api/health, /api/control responses | Not present. |
| Cookie flags | HttpOnly, SameSite=Lax (Secure is added on https). |

## 2. OWASP Top 10:2025

| Category | Status | Notes |
|---|---|---|
| A01 Broken Access Control | Good | Every route checks the signed-in user and ownership; tested above. Minor: deleting someone else's chat returns "ok" but does nothing. |
| A02 Security Misconfiguration | Good, with 3 items | Strict CSP, nosniff, frame denial, HSTS on https. Items: set `NIMBUS_PUBLIC_URL` (a forged Host header is accepted today; sign-in redirect addresses use it); keep `NIMBUS_ENABLE_CODE_EXEC` off; email verification still needs Brevo. The Security check list in Control now reports all of these. |
| A03 Software Supply Chain Failures | Medium | Python dependencies use `>=` (not pinned). Two animation libraries are downloaded at build time from jsDelivr/unpkg at pinned versions, with no hash check. Fix later: pin with a lock file and add file hashes. |
| A04 Cryptographic Failures | Good | scrypt password hashes, random session and key tokens stored only as hashes, recovery keys hashed and single-use. |
| A05 Injection | Good | See SQL and script tests. The code-runner is the one dangerous tool; it is off by default. |
| A06 Insecure Design | Good | Ask-before-risky-actions after reading outside content, daily caps per person and for the whole app, sign-up cap, resumable tasks. |
| A07 Authentication Failures | Medium | Throttled logins, codes and recovery; sessions wiped on password change. Gaps: no 2-step login (2FA); fake emails can sign up until Brevo is on; signup tells you if an email already exists (only while email is off). |
| A08 Software or Data Integrity Failures | Medium | Backups go to a private GitHub repo with a token; backup content is not signed. Same animation-library note as A03. |
| A09 Security Logging and Alerting Failures | Medium | An audit table records logins, tasks and key actions, and secrets are removed from logs. There are no alerts; you must look at Control > Owner overview and Render logs yourself. |
| A10 Mishandling of Exceptional Conditions | Good | Errors return a generic message, no stack traces. Failing models fall back silently; failing tasks stop and can resume. |

## 3. OWASP Top 10 for LLM Applications 2025

| Category | Status | Notes |
|---|---|---|
| LLM01 Prompt Injection | Partly mitigated | After the AI reads a web page, email or file, anything that writes, deletes, remembers, schedules or emails needs your tap on Approve; background runs cannot change anything. No design can fully stop it. |
| LLM02 Sensitive Information Disclosure | Good | Keys stay server-side; the model never sees them; logs are scrubbed. Users' messages do go to the model companies. |
| LLM03 Supply Chain | Medium | Same as A03; model names for new providers are unverified. |
| LLM04 Data and Model Poisoning | Low exposure | Nimbus trains nothing. Memory and Studio documents come from the owner. |
| LLM05 Improper Output Handling | Good | Model text is escaped before display; generated pages run in a sandboxed frame. |
| LLM06 Excessive Agency | Good | Tools are allow-listed, approvals for risky ones, emailing needs approval, delete always asks, task limits. |
| LLM07 System Prompt Leakage | Low risk | The system prompt holds no secrets. |
| LLM08 Vector and Embedding Weaknesses | Low | Search indexes are per user. |
| LLM09 Misinformation | Partly mitigated | Research reports must cite numbered sources, list gaps, and are checked automatically; the AI can still be wrong. |
| LLM10 Unbounded Consumption | Good | Per-person and whole-app daily caps, 5 model calls per task, 6 tasks a day, size and time limits. |

## 4. STRIDE

| Threat | Where | Control | Remaining risk |
|---|---|---|---|
| Spoofing | Login, OAuth, owner role | scrypt, throttles, verified-email requirement for the owner role | Stolen password = stolen account (no 2FA) |
| Tampering | Requests, stored data, tools | CSRF checks, parameterised SQL, approvals | Backup file not signed |
| Repudiation | Who did what | Audit table | No alerts, no tamper-proof log |
| Information disclosure | Other users' data, secrets, files | Ownership checks (tested), sandboxed downloads, log scrubbing | Code-runner could read server secrets if turned on; users' text goes to model providers |
| Denial of service | Free quota, free server | Per-IP flood limit, daily caps, sign-up cap, size limits | One free instance; limits reset on restart |
| Elevation of privilege | Owner role, tools | Owner needs a verified email once email is on; tool approvals | Misconfigured admin email list |

## 5. Found and fixed during this assessment

1. Packaging bug (medium): the live build never included `static/vendor`, so KaTeX math and its fonts could not load on Render. Fixed in `pyproject.toml`; a test now guards it.
2. Web fetching (found in 2.8.1): carrier-network and IPv6-mapped addresses were not blocked; two tools had no size limit. Fixed. Optional DNS pinning added (off).
3. Free-quota drain (2.8.2): added sign-up and whole-app caps.
4. Code runner risk: documented; Security check now flags it.
5. New Security check lines: code runner, owner set, public address set, whole-app budget.

## 6. Still open, in order of value

1. Turn on Brevo email verification (stops fake accounts).
2. Set `NIMBUS_PUBLIC_URL`.
3. Add 2-step login (2FA).
4. Pin dependencies with hashes.
5. Alerts (email you on spikes of sign-ups or errors).
6. An independent penetration test before holding sensitive data.

## Sources

- OWASP Top 10:2025: https://top10.owasp.org/2025/
- OWASP Top 10 for LLM Applications 2025: https://genai.owasp.org/llm-top-10/
- Microsoft, STRIDE threat categories: https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats
- OWASP Application Security Verification Standard: https://owasp.org/www-project-application-security-verification-standard/
- GSAP standard licence (free for commercial use): https://gsap.com/community/standard-license/
- Lenis (MIT): https://npmjs.com/package/lenis/v/1.1.21
- React Bits (MIT + Commons Clause, React only): https://github.com/DavidHDev/react-bits
