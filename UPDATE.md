# 3.3.0: the new look from your reference picture

- **Design rebuilt to match the reference:** glossy planet orb with a ring, serif greeting with the name in colour, soft glass cards, icon tiles, big rounded message box, "Need something specific?" banner, and a right-hand side rail (Recent chats, Your memory, Tools).
- **Three themes only:** White & blue (default), White & gold, Black & gold. Switch with the sun button at the top or in Account. Saved in your browser.
- **Quick actions are in the left side panel**, grouped (Search & research, Think deeply, Summarize, Write & create, Coding, Files & documents, More). Each one runs the real feature.
- **Five main items:** Home, Chat, Tools, Memory, Account.
- **Phone / installed app layout:** bottom tab bar, the sidebar becomes a drawer, the side rail becomes a sheet (Chat tab). Desktop and phone layouts switch automatically by screen size.
- Includes everything from 2.8.0 to 3.2.0 (agent tasks, security fixes, owner powers, memory, Forgot password by email code).
- Tested: 226 automated tests (fake AI models); browser checks at 360, 390, 430, 768, 1024 and 1440 px, all three themes, every quick action, theme saving, phone drawer and sheet, and the on-screen keyboard height. Voice uses the browser's speech recognition plus spoken replies, not a live phone-call stream.
- Not tested: the live Render site, real AI providers, email sending, real fonts (downloaded when Render builds).

# 3.1.0: new look, Forgot password by email

- **Forgot password** now emails a 6-digit code (no more recovery key). The recovery-key screens, the Settings section and the reminder banner are gone.
  This needs email switched on (see EMAIL_SETUP.md). Without it the screen says so plainly.
- **New design** in `polish.css`: white and ink, one blue accent, serif headings, the orb is back as a clean glass sphere.
- Sidebar tools are grouped (Work, Create, Know). Chat options (project, Temporary, Summarize, Search) moved to the top bar.
- Home jobs are an iPhone-style grouped list.
- Tested: 226 automated tests pass (fake AI models), no browser errors in light/dark and phone/desktop screenshots.
- Not tested: the live Render site, real AI providers, email sending, and the real Inter/Newsreader fonts (they download during the Render build; if that fails the app uses system fonts).

# Nimbus 3.0.0 - one zip with everything since 2.8.0

You have not uploaded 2.8.1 to 2.9.0, so this zip includes ALL of it: security fixes, owner powers, email setup guide, sign-up and whole-app caps, the design upgrade, agent tasks fixes, and the new memory controls.
New in 3.0: Memory panel (preferred name, edit, clear all, on/off), memory refuses passwords and keys, your message returns to the box if sending fails. Read `AUDIT_3_0.md` for the item-by-item answer to your brief and what is honestly not done.

## Upload: simplest safe way
Upload EVERY file in each folder below (GitHub only changes what differs). Open each address, tap "choose your files", select all, tap Commit changes.
1. `.../upload/main` : all loose files (Dockerfile, fetch_vendor.py, pyproject.toml, README.md, DEPLOY.md, UPDATE.md, EMAIL_SETUP.md, AUTH_SETUP.md, EXTRA_PROVIDERS.md, SECURITY_REPORT.md, AUDIT_3_0.md, extra_providers.json, extra_providers.example.json)
2. `.../upload/main/nimbus` : all .py files
3. `.../upload/main/nimbus/tools` : all files
4. `.../upload/main/nimbus/providers` : all files
5. `.../upload/main/nimbus/static` : index.html, app.js, studio.js, app.css, polish.css, motion.js, favicon.svg, icon-192.png, icon-512.png
6. `.../upload/main/tests` : all files

---

